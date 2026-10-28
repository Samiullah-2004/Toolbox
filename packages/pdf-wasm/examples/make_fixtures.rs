//! Writes tricky test PDFs for the browser tests:
//!   locked.pdf   - "owner password only" (opens without a password, like print-restricted statements)
//!   password.pdf - needs a password to open
//!   form.pdf     - a fillable form with a text field on page 2
//!   rotated.pdf  - page 1 has /Rotate 90.0, page 2 has /Rotate as a reference
//!
//!   cargo run --example make_fixtures -- <output folder>

// linked for its custom random source, which lopdf's encryption needs (see src/lib.rs)
extern crate pdf_wasm;

use lopdf::content::{Content, Operation};
use lopdf::{Document, EncryptionState, EncryptionVersion, Object, Permissions, Stream, StringFormat, dictionary};

fn sample(tag: &str, pages: u32) -> Document {
    let mut doc = Document::with_version("1.5");
    let pages_id = doc.new_object_id();
    let font_id = doc.add_object(dictionary! { "Type" => "Font", "Subtype" => "Type1", "BaseFont" => "Helvetica" });
    let mut kids = Vec::new();
    for n in 1..=pages {
        let content = Content {
            operations: vec![
                Operation::new("BT", vec![]),
                Operation::new("Tf", vec!["F1".into(), 28.into()]),
                Operation::new("Td", vec![72.into(), 700.into()]),
                Operation::new("Tj", vec![Object::string_literal(format!("{tag} page {n}"))]),
                Operation::new("ET", vec![]),
            ],
        };
        let content_id = doc.add_object(Stream::new(dictionary! {}, content.encode().unwrap()));
        kids.push(
            doc.add_object(dictionary! {
                "Type" => "Page", "Parent" => pages_id, "Contents" => content_id,
                "Resources" => dictionary! { "Font" => dictionary! { "F1" => font_id } },
                "MediaBox" => vec![0.into(), 0.into(), (500 + n as i64 * 10).into(), 800.into()],
            })
            .into(),
        );
    }
    doc.objects.insert(
        pages_id,
        Object::Dictionary(dictionary! { "Type" => "Pages", "Kids" => kids, "Count" => pages as i64 }),
    );
    let catalog = doc.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages_id });
    doc.trailer.set("Root", catalog);
    let id = Object::String(tag.repeat(16).into_bytes(), StringFormat::Hexadecimal);
    doc.trailer.set("ID", vec![id.clone(), id]);
    doc
}

fn encrypt(mut doc: Document, user_password: &str) -> Document {
    let state = EncryptionState::try_from(EncryptionVersion::V2 {
        document: &doc,
        owner_password: "owner-secret",
        user_password,
        key_length: 128,
        permissions: Permissions::PRINTABLE,
    })
    .unwrap();
    doc.encrypt(&state).unwrap();
    doc
}

fn main() {
    let dir = std::env::args().nth(1).expect("usage: make_fixtures <output folder>");
    let save = |mut doc: Document, name: &str| doc.save(format!("{dir}/{name}")).unwrap();

    save(encrypt(sample("Locked", 3), ""), "locked.pdf");
    save(encrypt(sample("Password", 1), "open-sesame"), "password.pdf");

    let mut form = sample("Form", 2);
    let page2 = form.get_pages()[&2];
    let field = form.add_object(dictionary! {
        "Type" => "Annot", "Subtype" => "Widget", "FT" => "Tx", "T" => Object::string_literal("Name"),
        "Rect" => vec![72.into(), 600.into(), 300.into(), 630.into()], "P" => page2,
    });
    form.get_dictionary_mut(page2).unwrap().set("Annots", vec![field.into()]);
    let root = form.trailer.get(b"Root").unwrap().as_reference().unwrap();
    form.get_dictionary_mut(root).unwrap().set("AcroForm", dictionary! { "Fields" => vec![field.into()] });
    save(form, "form.pdf");

    let mut rotated = sample("Rotated", 2);
    let pages = rotated.get_pages();
    rotated.get_dictionary_mut(pages[&1]).unwrap().set("Rotate", Object::Real(90.0));
    let ninety = rotated.add_object(Object::Integer(90));
    rotated.get_dictionary_mut(pages[&2]).unwrap().set("Rotate", ninety);
    save(rotated, "rotated.pdf");

    println!("wrote locked.pdf, password.pdf, form.pdf, rotated.pdf to {dir}");
}

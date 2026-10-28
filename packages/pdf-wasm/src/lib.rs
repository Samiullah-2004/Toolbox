//! Toolbox PDF engine.
//!
//! One operation does all the page work: [`assemble`] takes any number of PDFs and an
//! ordered list of pages (with an optional rotation for each) and builds a new PDF.
//!
//! - Merge PDF:        every page of every file, in file order
//! - Split PDF:        the chosen pages of one file
//! - Reorder & Rotate: all pages of one file, in a new order, with rotations
//!
//! It compiles to WebAssembly and runs inside the user's browser, so files are never
//! uploaded. The small C-style interface in [`ffi`] is what JavaScript calls.

use std::collections::{BTreeMap, HashSet};

use lopdf::{Dictionary, Document, Object, ObjectId, dictionary};

mod ffi;

/// One page of the result: which input file, which page (1-based), how much to rotate.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct PageRef {
    pub doc: u32,
    pub page: u32,
    /// Extra clockwise rotation in degrees: 0, 90, 180 or 270 (negative values allowed)
    pub rotate: i32,
}

#[derive(Debug, PartialEq, Eq)]
pub enum PdfError {
    /// The file is not a PDF, or it is damaged
    Invalid { doc: u32 },
    /// The file needs a password to open
    Encrypted { doc: u32 },
    /// A requested page does not exist
    PageOutOfRange { doc: u32, page: u32 },
    /// Nothing was selected
    NoPages,
    /// Writing the result failed
    Save,
}

impl PdfError {
    /// Numeric code shared with the JavaScript side (see apps/web/src/lib/pdf/engine.ts)
    pub fn code(&self) -> i32 {
        match self {
            PdfError::Invalid { .. } => 1,
            PdfError::Encrypted { .. } => 2,
            PdfError::PageOutOfRange { .. } => 3,
            PdfError::NoPages => 4,
            PdfError::Save => 5,
        }
    }

    /// Which input file the error is about, when it is about one
    pub fn doc(&self) -> Option<u32> {
        match self {
            PdfError::Invalid { doc } | PdfError::Encrypted { doc } | PdfError::PageOutOfRange { doc, .. } => {
                Some(*doc)
            }
            _ => None,
        }
    }
}

/// Opens a PDF. Files with an empty owner password are opened automatically;
/// files that really need a password are reported as `Encrypted`.
fn load(bytes: &[u8], doc: u32) -> Result<Document, PdfError> {
    match Document::load_mem(bytes) {
        Ok(document) if document.is_encrypted() => Err(PdfError::Encrypted { doc }),
        Ok(document) => Ok(document),
        Err(lopdf::Error::Decryption(_)) => Err(PdfError::Encrypted { doc }),
        Err(_) => Err(PdfError::Invalid { doc }),
    }
}

/// Number of pages in a PDF
pub fn page_count(bytes: &[u8]) -> Result<u32, PdfError> {
    Ok(load(bytes, 0)?.get_pages().len() as u32)
}

/// Some page settings can live on a parent node of the page tree instead of on the page.
/// Pages are moved into a new tree, so copy those settings onto the page itself first.
fn copy_inherited_attributes(doc: &mut Document, page_id: ObjectId) {
    const INHERITABLE: [&[u8]; 4] = [b"Resources", b"MediaBox", b"CropBox", b"Rotate"];

    let Ok(page) = doc.get_dictionary(page_id) else { return };
    let mut missing: Vec<&[u8]> = INHERITABLE.iter().copied().filter(|key| !page.has(key)).collect();
    let mut found: Vec<(&[u8], Object)> = Vec::new();
    let mut parent = page.get(b"Parent").and_then(Object::as_reference).ok();
    let mut seen = HashSet::new();

    while let Some(parent_id) = parent {
        if missing.is_empty() || !seen.insert(parent_id) {
            break;
        }
        let Ok(node) = doc.get_dictionary(parent_id) else { break };
        missing.retain(|key| match node.get(key) {
            Ok(value) => {
                found.push((key, value.clone()));
                false
            }
            Err(_) => true,
        });
        parent = node.get(b"Parent").and_then(Object::as_reference).ok();
    }

    if let Ok(page) = doc.get_dictionary_mut(page_id) {
        for (key, value) in found {
            page.set(key, value);
        }
        // A page must have a size; fall back to US Letter like PDF readers do
        if !page.has(b"MediaBox") {
            page.set("MediaBox", vec![0.into(), 0.into(), 612.into(), 792.into()]);
        }
    }
}

fn normalize_rotation(degrees: i64) -> i64 {
    let snapped = (degrees as f64 / 90.0).round() as i64 * 90;
    snapped.rem_euclid(360)
}

/// Builds a new PDF from the given pages, in the given order.
pub fn assemble(inputs: &[&[u8]], selection: &[PageRef]) -> Result<Vec<u8>, PdfError> {
    if selection.is_empty() {
        return Err(PdfError::NoPages);
    }

    let mut out = Document::with_version("1.7");
    let mut next_id = 1;
    let mut page_maps: Vec<BTreeMap<u32, ObjectId>> = Vec::with_capacity(inputs.len());

    // Only load the files the selection actually uses
    let used_docs: HashSet<u32> = selection.iter().map(|page| page.doc).collect();

    for (index, bytes) in inputs.iter().enumerate() {
        let index = index as u32;
        if !used_docs.contains(&index) {
            page_maps.push(BTreeMap::new());
            continue;
        }
        let mut doc = load(bytes, index)?;
        // Give every file its own range of object numbers so they don't collide
        doc.renumber_objects_with(next_id);
        next_id = doc.max_id + 1;

        let pages = doc.get_pages();
        for page_id in pages.values() {
            copy_inherited_attributes(&mut doc, *page_id);
        }
        page_maps.push(pages);
        out.objects.extend(doc.objects);
    }
    out.max_id = next_id - 1;

    let pages_id = out.new_object_id();
    let mut kids: Vec<Object> = Vec::with_capacity(selection.len());
    let mut used_pages = HashSet::new();

    for page_ref in selection {
        let page_id = page_maps
            .get(page_ref.doc as usize)
            .and_then(|pages| pages.get(&page_ref.page))
            .copied()
            .ok_or(PdfError::PageOutOfRange { doc: page_ref.doc, page: page_ref.page })?;

        // A page used twice needs its own copy, so each copy can have its own rotation
        let target = if used_pages.insert(page_id) {
            page_id
        } else {
            let copy: Dictionary = out.get_dictionary(page_id).map_err(|_| PdfError::Save)?.clone();
            out.add_object(copy)
        };

        let page = out.get_dictionary_mut(target).map_err(|_| PdfError::Save)?;
        page.set("Parent", pages_id);
        let current = page.get(b"Rotate").and_then(Object::as_i64).unwrap_or(0);
        let rotation = normalize_rotation(current + page_ref.rotate as i64);
        if rotation == 0 {
            page.remove(b"Rotate");
        } else {
            page.set("Rotate", rotation);
        }
        kids.push(target.into());
    }

    let count = kids.len() as i64;
    out.objects.insert(
        pages_id,
        Object::Dictionary(dictionary! {
            "Type" => "Pages",
            "Kids" => kids,
            "Count" => count,
        }),
    );
    let catalog_id = out.add_object(dictionary! {
        "Type" => "Catalog",
        "Pages" => pages_id,
    });
    out.trailer.set("Root", catalog_id);

    // Drop everything the new page tree doesn't use: old catalogs, page trees, bookmarks
    out.prune_objects();
    out.renumber_objects();
    out.compress();

    let mut bytes = Vec::new();
    out.save_to(&mut bytes).map_err(|_| PdfError::Save)?;
    Ok(bytes)
}

// getrandom is only used by lopdf for encryption, which Toolbox never does. The build sets
// `getrandom_backend = "custom"` (.cargo/config.toml) so no OS-specific code is needed.
// In the browser the random bytes come from crypto.getRandomValues via JavaScript.
#[cfg(target_arch = "wasm32")]
#[unsafe(no_mangle)]
unsafe extern "Rust" fn __getrandom_v03_custom(dest: *mut u8, len: usize) -> Result<(), getrandom::Error> {
    #[link(wasm_import_module = "env")]
    unsafe extern "C" {
        /// Provided by JavaScript: fills the buffer with crypto.getRandomValues
        fn fill_random(ptr: *mut u8, len: usize);
    }
    unsafe { fill_random(dest, len) };
    Ok(())
}

// Native builds (only used by `cargo test`) read randomness from the system clock and a counter.
// Good enough for tests; never used for real encryption.
#[cfg(not(target_arch = "wasm32"))]
#[unsafe(no_mangle)]
unsafe extern "Rust" fn __getrandom_v03_custom(dest: *mut u8, len: usize) -> Result<(), getrandom::Error> {
    use std::sync::atomic::{AtomicU64, Ordering};
    static COUNTER: AtomicU64 = AtomicU64::new(0x9E37_79B9_7F4A_7C15);
    let mut state = COUNTER.fetch_add(0x9E37_79B9_7F4A_7C15, Ordering::Relaxed)
        ^ std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_nanos() as u64).unwrap_or(1);
    for i in 0..len {
        state ^= state << 13;
        state ^= state >> 7;
        state ^= state << 17;
        unsafe { *dest.add(i) = state as u8 };
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use lopdf::content::{Content, Operation};
    use lopdf::{Stream, dictionary};

    /// A small PDF whose pages say "Doc <tag> page <n>", built like real-world files:
    /// MediaBox and Resources live on the Pages node and are inherited by each page.
    fn sample(tag: &str, pages: u32) -> Vec<u8> {
        let mut doc = Document::with_version("1.5");
        let pages_id = doc.new_object_id();
        let font_id = doc.add_object(dictionary! {
            "Type" => "Font", "Subtype" => "Type1", "BaseFont" => "Helvetica",
        });
        let resources_id = doc.add_object(dictionary! { "Font" => dictionary! { "F1" => font_id } });
        let mut kids = Vec::new();
        for n in 1..=pages {
            let content = Content {
                operations: vec![
                    Operation::new("BT", vec![]),
                    Operation::new("Tf", vec!["F1".into(), 24.into()]),
                    Operation::new("Td", vec![72.into(), 700.into()]),
                    Operation::new("Tj", vec![Object::string_literal(format!("Doc {tag} page {n}"))]),
                    Operation::new("ET", vec![]),
                ],
            };
            let content_id = doc.add_object(Stream::new(dictionary! {}, content.encode().unwrap()));
            let page_id = doc.add_object(dictionary! {
                "Type" => "Page", "Parent" => pages_id, "Contents" => content_id,
            });
            kids.push(page_id.into());
        }
        doc.objects.insert(
            pages_id,
            Object::Dictionary(dictionary! {
                "Type" => "Pages", "Kids" => kids, "Count" => pages as i64,
                "Resources" => resources_id,
                "MediaBox" => vec![0.into(), 0.into(), 595.into(), 842.into()],
            }),
        );
        let catalog_id = doc.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages_id });
        doc.trailer.set("Root", catalog_id);
        let mut bytes = Vec::new();
        doc.save_to(&mut bytes).unwrap();
        bytes
    }

    /// The text of each page of a result, plus each page's rotation
    fn describe(bytes: &[u8]) -> Vec<(String, i64)> {
        let doc = Document::load_mem(bytes).unwrap();
        doc.get_pages()
            .iter()
            .map(|(number, id)| {
                let text = doc.extract_text(&[*number]).unwrap().trim().to_string();
                let rotate = doc.get_dictionary(*id).unwrap().get(b"Rotate").and_then(Object::as_i64).unwrap_or(0);
                (text, rotate)
            })
            .collect()
    }

    fn all_pages(doc: u32, count: u32) -> Vec<PageRef> {
        (1..=count).map(|page| PageRef { doc, page, rotate: 0 }).collect()
    }

    #[test]
    fn counts_pages() {
        assert_eq!(page_count(&sample("A", 3)), Ok(3));
    }

    #[test]
    fn merges_files_in_order() {
        let a = sample("A", 2);
        let b = sample("B", 3);
        let mut selection = all_pages(0, 2);
        selection.extend(all_pages(1, 3));
        let result = assemble(&[&a, &b], &selection).unwrap();
        let pages: Vec<String> = describe(&result).into_iter().map(|(text, _)| text).collect();
        assert_eq!(pages, ["Doc A page 1", "Doc A page 2", "Doc B page 1", "Doc B page 2", "Doc B page 3"]);
    }

    #[test]
    fn merged_pages_keep_inherited_size_and_fonts() {
        let a = sample("A", 1);
        let b = sample("B", 1);
        let result = assemble(&[&a, &b], &[PageRef { doc: 1, page: 1, rotate: 0 }, PageRef { doc: 0, page: 1, rotate: 0 }])
            .unwrap();
        let doc = Document::load_mem(&result).unwrap();
        for id in doc.get_pages().values() {
            let page = doc.get_dictionary(*id).unwrap();
            assert!(page.has(b"MediaBox"), "page lost its size");
            assert!(page.has(b"Resources"), "page lost its fonts");
        }
        assert_eq!(describe(&result)[0].0, "Doc B page 1");
    }

    #[test]
    fn splits_out_chosen_pages() {
        let a = sample("A", 6);
        let selection = [3, 4, 5].map(|page| PageRef { doc: 0, page, rotate: 0 });
        let result = assemble(&[&a], &selection).unwrap();
        let pages: Vec<String> = describe(&result).into_iter().map(|(text, _)| text).collect();
        assert_eq!(pages, ["Doc A page 3", "Doc A page 4", "Doc A page 5"]);
    }

    #[test]
    fn reorders_and_rotates() {
        let a = sample("A", 3);
        let selection = [
            PageRef { doc: 0, page: 3, rotate: 90 },
            PageRef { doc: 0, page: 1, rotate: 0 },
            PageRef { doc: 0, page: 2, rotate: -90 },
        ];
        let result = assemble(&[&a], &selection).unwrap();
        assert_eq!(
            describe(&result),
            [("Doc A page 3".to_string(), 90), ("Doc A page 1".to_string(), 0), ("Doc A page 2".to_string(), 270)]
        );
    }

    #[test]
    fn rotation_adds_to_existing_rotation() {
        let first = assemble(&[&sample("A", 1)], &[PageRef { doc: 0, page: 1, rotate: 180 }]).unwrap();
        let second = assemble(&[&first], &[PageRef { doc: 0, page: 1, rotate: 270 }]).unwrap();
        assert_eq!(describe(&second)[0].1, 90);
    }

    #[test]
    fn same_page_twice_gets_separate_rotations() {
        let a = sample("A", 1);
        let selection = [PageRef { doc: 0, page: 1, rotate: 0 }, PageRef { doc: 0, page: 1, rotate: 90 }];
        let result = assemble(&[&a], &selection).unwrap();
        let rotations: Vec<i64> = describe(&result).into_iter().map(|(_, rotate)| rotate).collect();
        assert_eq!(rotations, [0, 90]);
    }

    #[test]
    fn reports_bad_input() {
        assert_eq!(assemble(&[b"not a pdf"], &all_pages(0, 1)), Err(PdfError::Invalid { doc: 0 }));
        assert_eq!(assemble(&[&sample("A", 2)], &[]), Err(PdfError::NoPages));
        assert_eq!(
            assemble(&[&sample("A", 2)], &[PageRef { doc: 0, page: 9, rotate: 0 }]),
            Err(PdfError::PageOutOfRange { doc: 0, page: 9 })
        );
    }

    #[test]
    fn unused_files_are_not_opened() {
        // The second "file" is junk, but only pages of the first are selected
        let result = assemble(&[&sample("A", 1), b"junk"], &all_pages(0, 1));
        assert!(result.is_ok());
    }

    #[test]
    fn rotation_snaps_to_quarter_turns() {
        assert_eq!(normalize_rotation(-90), 270);
        assert_eq!(normalize_rotation(450), 90);
        assert_eq!(normalize_rotation(89), 90);
    }
}

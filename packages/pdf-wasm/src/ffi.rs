//! The interface JavaScript calls (apps/web/src/lib/pdf/pdf-wasm.ts).
//!
//! WebAssembly functions can only pass numbers, so data moves through WebAssembly memory:
//! 1. JS calls `alloc(n)` and copies its request into the returned memory.
//! 2. JS calls `pdf_assemble(ptr, n)`. Rust reads the request and frees it.
//! 3. On success (0), JS copies `output_len()` bytes from `output_ptr()`, then calls `free_output()`.
//!    On failure the return value is an error code and `last_error_doc()` says which file.
//!
//! Request layout, all numbers little-endian 32-bit:
//!   file_count, file_len * file_count,
//!   page_count, (doc, page, rotate) * page_count,
//!   then the bytes of every file, one after another.

use std::cell::{Cell, RefCell};

use crate::{OpenPdf, PageRef, PdfError, assemble, page_count};

/// The request itself is malformed (a bug in the caller, not a problem with the files)
const BAD_REQUEST: i32 = 6;

thread_local! {
    static OUTPUT: RefCell<Vec<u8>> = const { RefCell::new(Vec::new()) };
    static ERROR_DOC: Cell<i32> = const { Cell::new(-1) };
    /// The file opened with `pdf_open`, for copying out single pages
    static OPEN: RefCell<Option<OpenPdf>> = const { RefCell::new(None) };
}

/// Reserves `len` bytes of WebAssembly memory for JavaScript to write into
#[unsafe(no_mangle)]
pub extern "C" fn alloc(len: usize) -> *mut u8 {
    let mut buffer = Vec::<u8>::with_capacity(len);
    let ptr = buffer.as_mut_ptr();
    std::mem::forget(buffer);
    ptr
}

/// Frees memory from `alloc`
///
/// # Safety
/// `ptr` and `len` must come from one earlier `alloc(len)` call, and be freed only once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn dealloc(ptr: *mut u8, len: usize) {
    drop(unsafe { Vec::from_raw_parts(ptr, 0, len) });
}

/// Takes ownership of a request written by JavaScript
unsafe fn take_request(ptr: *mut u8, len: usize) -> Vec<u8> {
    unsafe { Vec::from_raw_parts(ptr, len, len) }
}

struct Reader<'a> {
    bytes: &'a [u8],
    pos: usize,
}

impl<'a> Reader<'a> {
    fn u32(&mut self) -> Option<u32> {
        let chunk = self.bytes.get(self.pos..self.pos + 4)?;
        self.pos += 4;
        Some(u32::from_le_bytes(chunk.try_into().ok()?))
    }

    fn take(&mut self, len: usize) -> Option<&'a [u8]> {
        let chunk = self.bytes.get(self.pos..self.pos.checked_add(len)?)?;
        self.pos += len;
        Some(chunk)
    }
}

fn parse_request(bytes: &[u8]) -> Option<(Vec<&[u8]>, Vec<PageRef>)> {
    let mut reader = Reader { bytes, pos: 0 };
    let file_count = reader.u32()? as usize;
    let lengths: Vec<usize> = (0..file_count).map(|_| reader.u32().map(|n| n as usize)).collect::<Option<_>>()?;
    let page_count = reader.u32()? as usize;
    let selection: Vec<PageRef> = (0..page_count)
        .map(|_| Some(PageRef { doc: reader.u32()?, page: reader.u32()?, rotate: reader.u32()? as i32 }))
        .collect::<Option<_>>()?;
    let files: Vec<&[u8]> = lengths.into_iter().map(|len| reader.take(len)).collect::<Option<_>>()?;
    Some((files, selection))
}

fn fail(error: PdfError) -> i32 {
    ERROR_DOC.set(error.doc().map(|doc| doc as i32).unwrap_or(-1));
    error.code()
}

/// Builds a PDF from the request. Returns 0 on success, or an error code.
///
/// # Safety
/// `ptr` must come from `alloc(len)` and hold `len` written bytes. This call frees it.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn pdf_assemble(ptr: *mut u8, len: usize) -> i32 {
    let request = unsafe { take_request(ptr, len) };
    ERROR_DOC.set(-1);
    let Some((files, selection)) = parse_request(&request) else { return BAD_REQUEST };
    match assemble(&files, &selection) {
        Ok(bytes) => {
            OUTPUT.set(bytes);
            0
        }
        Err(error) => fail(error),
    }
}

/// Counts the pages of one PDF. Returns the count, or minus an error code.
///
/// # Safety
/// `ptr` must come from `alloc(len)` and hold `len` written bytes. This call frees it.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn pdf_page_count(ptr: *mut u8, len: usize) -> i32 {
    let request = unsafe { take_request(ptr, len) };
    match page_count(&request) {
        Ok(count) => count as i32,
        Err(error) => -fail(error),
    }
}

/// Reads a PDF once and keeps it open for `pdf_extract`. Returns its page count, or minus an error code.
///
/// # Safety
/// `ptr` must come from `alloc(len)` and hold `len` written bytes. This call frees it.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn pdf_open(ptr: *mut u8, len: usize) -> i32 {
    let request = unsafe { take_request(ptr, len) };
    match OpenPdf::open(&request) {
        Ok(open) => {
            let count = open.page_count() as i32;
            OPEN.set(Some(open));
            count
        }
        Err(error) => -fail(error),
    }
}

/// Copies one page of the open PDF into a new PDF (read it with `output_ptr`).
/// Returns 0 on success, or an error code.
#[unsafe(no_mangle)]
pub extern "C" fn pdf_extract(page: u32, rotate: i32) -> i32 {
    let result = OPEN.with_borrow(|open| match open {
        Some(open) => open.extract(page, rotate),
        None => Err(PdfError::NoPages),
    });
    match result {
        Ok(bytes) => {
            OUTPUT.set(bytes);
            0
        }
        Err(error) => fail(error),
    }
}

/// Releases the PDF opened with `pdf_open`
#[unsafe(no_mangle)]
pub extern "C" fn pdf_close() {
    OPEN.set(None);
}

#[unsafe(no_mangle)]
pub extern "C" fn output_ptr() -> *const u8 {
    OUTPUT.with_borrow(|output| output.as_ptr())
}

#[unsafe(no_mangle)]
pub extern "C" fn output_len() -> usize {
    OUTPUT.with_borrow(|output| output.len())
}

/// Releases the last result once JavaScript has copied it
#[unsafe(no_mangle)]
pub extern "C" fn free_output() {
    OUTPUT.set(Vec::new());
}

/// Which input file (0-based) the last error was about, or -1
#[unsafe(no_mangle)]
pub extern "C" fn last_error_doc() -> i32 {
    ERROR_DOC.get()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn request(files: &[&[u8]], pages: &[(u32, u32, i32)]) -> Vec<u8> {
        let mut out = Vec::new();
        out.extend((files.len() as u32).to_le_bytes());
        for file in files {
            out.extend((file.len() as u32).to_le_bytes());
        }
        out.extend((pages.len() as u32).to_le_bytes());
        for (doc, page, rotate) in pages {
            out.extend(doc.to_le_bytes());
            out.extend(page.to_le_bytes());
            out.extend((*rotate as u32).to_le_bytes());
        }
        for file in files {
            out.extend(*file);
        }
        out
    }

    #[test]
    fn parses_a_request() {
        let bytes = request(&[b"abc", b"de"], &[(0, 1, 0), (1, 2, -90)]);
        let (files, pages) = parse_request(&bytes).unwrap();
        assert_eq!(files, [&b"abc"[..], &b"de"[..]]);
        assert_eq!(pages[1], PageRef { doc: 1, page: 2, rotate: -90 });
    }

    #[test]
    fn rejects_truncated_requests() {
        let mut bytes = request(&[b"abc"], &[(0, 1, 0)]);
        bytes.pop();
        assert!(parse_request(&bytes).is_none());
    }
}

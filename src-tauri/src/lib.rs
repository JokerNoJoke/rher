// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn read_file_binary(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn proxy_fetch_audio(
    url: String,
    method: String,
    headers: Option<std::collections::HashMap<String, String>>,
    body: Option<String>,
    timeout_ms: Option<u64>,
) -> Result<Vec<u8>, String> {
    let client = reqwest::blocking::Client::new();
    let method = match method.to_uppercase().as_str() {
        "GET" => reqwest::Method::GET,
        "POST" => reqwest::Method::POST,
        "PUT" => reqwest::Method::PUT,
        "DELETE" => reqwest::Method::DELETE,
        "PATCH" => reqwest::Method::PATCH,
        "HEAD" => reqwest::Method::HEAD,
        "OPTIONS" => reqwest::Method::OPTIONS,
        _ => return Err(format!("Unsupported method: {}", method)),
    };

    let mut request_builder = client.request(method, &url);

    if let Some(h) = headers {
        for (k, v) in h {
            request_builder = request_builder.header(k, v);
        }
    }

    if let Some(b) = body {
        request_builder = request_builder.body(b);
    }

    if let Some(ms) = timeout_ms {
        request_builder = request_builder.timeout(std::time::Duration::from_millis(ms));
    }

    let response = request_builder.send().map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("Request failed with status: {}", response.status()));
    }

    let bytes = response.bytes().map_err(|e| e.to_string())?;
    Ok(bytes.to_vec())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, read_file_binary, proxy_fetch_audio])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_read_file_binary() {
        let mut file = NamedTempFile::new().unwrap();
        let content = b"hello world";
        file.write_all(content).unwrap();

        let path = file.path().to_str().unwrap().to_string();
        let result = read_file_binary(path).unwrap();

        assert_eq!(result, content);
    }

    #[test]
    fn test_read_file_binary_not_found() {
        let result = read_file_binary("/non/existent/path".to_string());
        assert!(result.is_err());
    }

    #[test]
    fn test_proxy_fetch_audio_invalid_url() {
        // Test with an invalid URL to ensure the function executes and returns an error (but not panic)
        let result = proxy_fetch_audio(
            "invalid-url".to_string(),
            "GET".to_string(),
            None,
            None,
            None
        );
        assert!(result.is_err());
    }
}

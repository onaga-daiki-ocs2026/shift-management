package com.shift.shift_management.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class SupabaseStorageService {

	@Value("${supabase.url:}")
	private String supabaseUrl;

	@Value("${supabase.service-role-key:}")
	private String serviceRoleKey;

	@Value("${supabase.bucket:shift-pdfs}")
	private String bucket;

	private final RestTemplate restTemplate = new RestTemplate();

	/**
	 * Supabase Storageにファイルをアップロード（既存があれば上書き）し、
	 * 公開URLを返す。
	 *
	 * @param fileBytes  アップロードするファイルの中身
	 * @param objectPath バケット内のファイルパス（例: "2026-07-19.pdf"）
	 */
	public String upload(byte[] fileBytes, String objectPath) {
		if (supabaseUrl == null || supabaseUrl.isBlank()) {
			throw new IllegalStateException(
					"SUPABASE_URL が設定されていません。環境変数を確認してください。");
		}
		if (serviceRoleKey == null || serviceRoleKey.isBlank()) {
			throw new IllegalStateException(
					"SUPABASE_SERVICE_ROLE_KEY が設定されていません。環境変数を確認してください。");
		}

		String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + objectPath;

		HttpHeaders headers = new HttpHeaders();
		headers.setBearerAuth(serviceRoleKey);
		headers.set("apikey", serviceRoleKey);
		headers.setContentType(MediaType.APPLICATION_PDF);
		// 既に同じパスにファイルがあれば上書きする
		headers.set("x-upsert", "true");

		HttpEntity<byte[]> requestEntity = new HttpEntity<>(fileBytes, headers);

		restTemplate.exchange(uploadUrl, HttpMethod.POST, requestEntity, String.class);

		return supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + objectPath;
	}
}

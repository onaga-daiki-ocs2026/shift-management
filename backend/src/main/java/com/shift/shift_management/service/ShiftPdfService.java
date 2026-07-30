package com.shift.shift_management.service;

import com.shift.shift_management.entity.ShiftPdf;
import com.shift.shift_management.entity.User;
import com.shift.shift_management.repository.ShiftPdfRepository;
import com.shift.shift_management.repository.UserRepository;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@RequiredArgsConstructor
@Service
public class ShiftPdfService {

	private static final DateTimeFormatter DATE_FORMAT =
			DateTimeFormatter.ofPattern("M月d日");

	// PDFファイルのマジックナンバー（先頭バイト列 "%PDF-"）
	private static final byte[] PDF_MAGIC_BYTES = {0x25, 0x50, 0x44, 0x46, 0x2D};

	private final ShiftPdfRepository shiftPdfRepository;
	private final SupabaseStorageService supabaseStorageService;
	private final UserRepository userRepository;
	private final LineNotificationService lineNotificationService;

	public String uploadPdf(MultipartFile file, LocalDate periodStart, String uploaderName)
			throws IOException {

		validatePdf(file);

		// 期間の開始日をファイル名にすることで、
		// 同じ期間のPDFは常に同じパスに上書き保存される。
		// 期間が違えば別ファイルとして追加保存される。
		String objectPath = periodStart.toString() + ".pdf";

		String pdfUrl = supabaseStorageService.upload(file.getBytes(), objectPath);

		// 同じ期間（periodStart）のレコードがあれば更新、無ければ新規追加
		Optional<ShiftPdf> existing = shiftPdfRepository.findByPeriodStart(periodStart);
		ShiftPdf shiftPdf = existing.orElseGet(ShiftPdf::new);
		shiftPdf.setPeriodStart(periodStart);
		shiftPdf.setPdfUrl(pdfUrl);
		// 既存カラムをそのまま「保存先パス」として流用（DBスキーマ変更なしで済ませるため）
		shiftPdf.setCloudinaryPublicId(objectPath);
		shiftPdfRepository.save(shiftPdf);

		// シフト確定をLINEで全スタッフに通知（対象期間・更新者つき）
		notifyStaffShiftConfirmed(periodStart, uploaderName);

		return pdfUrl;
	}

	// アップロードされたファイルが実際にPDFかどうかを中身のマジックナンバーで検証する。
	// Content-Type（file.getContentType()）はクライアント側で自由に書き換えられ、
	// かつブラウザ/ツールの都合で正規のPDFでも一致しないことがあるため、
	// 拒否条件には使わず参考情報としてログに残すだけに留める。
	private void validatePdf(MultipartFile file) throws IOException {
		if (file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ファイルが空です");
		}

		byte[] header = new byte[PDF_MAGIC_BYTES.length];
		try (InputStream is = file.getInputStream()) {
			int read = is.readNBytes(header, 0, header.length);
			if (read < PDF_MAGIC_BYTES.length || !Arrays.equals(header, PDF_MAGIC_BYTES)) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PDFファイルのみアップロードできます");
			}
		}

		if (!MediaType.APPLICATION_PDF_VALUE.equals(file.getContentType())) {
			log.info(
					"アップロードファイルのContent-Typeがapplication/pdfではありませんが、中身がPDFのため許可します: contentType={}",
					file.getContentType());
		}
	}

	public String getCurrentPdfUrl(LocalDate periodStart) {
		return shiftPdfRepository
				.findByPeriodStart(periodStart)
				.map(ShiftPdf::getPdfUrl)
				.orElse(null);
	}

	// 公開済みのPDFを、新しい期間の順に直近5件だけ一覧取得
	// （5件より前のものはDBには残っているが、ここでは返さない）
	public List<ShiftPdf> findRecentPdfs() {
		return shiftPdfRepository.findTop5ByOrderByPeriodStartDesc();
	}

	private void notifyStaffShiftConfirmed(LocalDate periodStart, String uploaderName) {
		LocalDate periodEnd = periodStart.plusDays(13);

		String message =
				"📋 " + periodStart.format(DATE_FORMAT) + "から"
						+ periodEnd.format(DATE_FORMAT) + "のシフトを公開しました。（更新者: " + uploaderName + "さん）\n"
						+ "アプリの「確定シフト確認」からご確認ください。";

		// STAFF/ADMIN問わず、LINE連携しているユーザー全員に通知する
		lineNotificationService.notifyBatch(userRepository.findAll(), message, "シフト確定");
	}
}
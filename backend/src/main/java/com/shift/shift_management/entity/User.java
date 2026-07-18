package com.shift.shift_management.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	// LINE固有ID
	@Column(nullable = false, unique = true)
	private String lineUserId;

	// LINE表示名
	private String displayName;

	// STAFF / ADMIN
	private String role = "STAFF";

	// HALL / KITCHEN
	private String position = "HALL";

	// 登録日時
	private LocalDateTime createdAt;

	private Integer sortOrder = 0;

	// 契約日数（週あたり、シフト作成の補助に使用）
	private Integer contractDays;

	// 契約時間（週あたりの時間数、シフト作成の補助に使用）
	private Double contractHours;

	@PrePersist
	public void onCreate() {
		createdAt = LocalDateTime.now();
	}
}
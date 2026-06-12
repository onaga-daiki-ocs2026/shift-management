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

	// LINE表示吁E
	private String displayName;

	// STAFF / ADMIN
	private String role = "STAFF";

	// 登録日晁E
	private LocalDateTime createdAt;

	@PrePersist
	public void onCreate() {
		createdAt = LocalDateTime.now();
	}
}

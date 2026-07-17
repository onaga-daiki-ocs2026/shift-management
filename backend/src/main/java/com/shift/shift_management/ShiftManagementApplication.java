package com.shift.shift_management;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class ShiftManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(ShiftManagementApplication.class, args);
	}
}
import api from "../api";
import type { UserProfile, UpdateUserRequest } from "./user.types";

class UserService {
	async updateUser(data?: UpdateUserRequest, file?: File): Promise<UserProfile> {
		const formData = new FormData();
		if (data) {
			formData.append(
				"data",
				new Blob(
					[JSON.stringify(data)],
					{
						type: "application/json"
					}
				)
			);
		}

		if (file) {
			formData.append("file", file);
		}

		const response = await api.patch<UserProfile>("/users", 
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data"
				}
			}
		);

		return response.data;
	}
}

export const userService = new UserService();
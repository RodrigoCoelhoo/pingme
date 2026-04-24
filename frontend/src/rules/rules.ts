export type Rule = (value: string) => true | string;

export const passwordRules = (t: any): Rule[] => [
	(v) => (v.length >= 8 && v.length <= 100) || t("input.passwordLength"),
	(v) =>
		/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&\-_])[A-Za-z\d@$!%*?&\-_]+$/.test(v) ||
		t("input.passwordRequirements"),
];

export const usernameRules = (t: any): Rule[] => [
	(v) => (v.length >= 3 && v.length <= 50) || t("input.usernameLength"),
	(v) => /^[A-Za-z0-9_-]+$/.test(v) || t("input.usernameRequirements"),
];

export const emailRules = (t: any): Rule[] => [
	(v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || t("input.invalidEmail"),
];

export const urlRules = (t: any): Rule[] => [
	(v) =>
		v.length === 0 || /^https?:\/\/[\w.-]+(\.[\w\.-]+)+([\/?].*)?$/.test(v) ||
		t("input.invalidUrl"),

	(v) => v.length <= 2048 || t("input.urlLength"),
];

export const displayNameRules = (t: any): Rule[] => [
	(v) => (v.length >= 1 && v.length <= 100) || t("input.displayNameLength"),
];
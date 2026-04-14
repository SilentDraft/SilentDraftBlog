import type { ObjectId } from "mongodb";

export type IconRef = {
	type: "lucide" | "simple-icons";
	name: string;
};

export type Post = {
	_id: ObjectId;
	slug: string;
	title: string;
	description: string;
	body: string;
	tags: string[];
	image: string | null;
	draft: boolean;
	createdAt: Date;
	updatedAt: Date | null;
};

export type ProjectInfoItem = {
	text: string;
	icon: IconRef;
	link?: string;
};

export type Project = {
	_id: ObjectId;
	slug: string;
	title: string;
	description: string;
	body: string;
	image: string;
	link: string | null;
	date: Date;
	info: ProjectInfoItem[];
};

export type Tag = {
	_id: ObjectId;
	id: string;
};

export type QuickInfoItem = {
	_id: ObjectId;
	order: number;
	icon: IconRef;
	text: string;
};

export type SocialItem = {
	_id: ObjectId;
	order: number;
	icon: IconRef;
	text: string;
	link: string;
};

export type WorkExperienceItem = {
	_id: ObjectId;
	order: number;
	title: string;
	company: string;
	duration: string;
	description: string;
};

export type StaticPage = {
	_id: ObjectId;
	slug: string;
	body: string;
};

export type ImageMeta = {
	_id: ObjectId;
	filename: string;
	url: string;
	size: number;
	mimeType: string;
	uploadedAt: Date;
};

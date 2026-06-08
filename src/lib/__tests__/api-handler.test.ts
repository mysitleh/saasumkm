import { describe, it, expect } from "vitest";
import {
  AppError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooMany,
} from "@/lib/api-handler";

describe("AppError factories", () => {
  it("badRequest → 400 with custom message and optional code", () => {
    const err = badRequest("Nama wajib diisi", "NAME_REQUIRED");
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(400);
    expect(err.message).toBe("Nama wajib diisi");
    expect(err.code).toBe("NAME_REQUIRED");
  });

  it("unauthorized → 401 with default message", () => {
    const err = unauthorized();
    expect(err.status).toBe(401);
    expect(err.message).toBe("Unauthorized");
  });

  it("forbidden → 403 with default message", () => {
    expect(forbidden().status).toBe(403);
    expect(forbidden().message).toBe("Forbidden");
  });

  it("notFound → 404 with Indonesian default", () => {
    const err = notFound();
    expect(err.status).toBe(404);
    expect(err.message).toBe("Tidak ditemukan");
  });

  it("notFound accepts a custom message", () => {
    expect(notFound("Produk tidak ada").message).toBe("Produk tidak ada");
  });

  it("conflict → 409", () => {
    const err = conflict("Slug sudah dipakai");
    expect(err.status).toBe(409);
    expect(err.message).toBe("Slug sudah dipakai");
  });

  it("tooMany → 429 with default rate-limit message", () => {
    const err = tooMany();
    expect(err.status).toBe(429);
    expect(err.message).toContain("Terlalu banyak permintaan");
  });

  it("AppError is throwable and catchable as Error", () => {
    expect(() => {
      throw badRequest("boom");
    }).toThrow("boom");
  });
});

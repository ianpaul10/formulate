import { describe, it, expect } from "vitest";
import { extractNestedKeys, getNestedValue } from "../src/utils.js";

describe("extractNestedKeys", () => {
  it("should handle flat object", () => {
    // Arrange
    const input = {
      name: "John",
      age: 30,
      email: "john@example.com",
    };

    // Act
    const result = extractNestedKeys(input);

    // Assert
    expect(result).toEqual(["name", "age", "email"]);
  });

  it("should handle nested object with single level", () => {
    // Arrange
    const input = {
      name: "John",
      address: {
        street: "123 Main St",
        city: "Boston",
      },
    };

    // Act
    const result = extractNestedKeys(input);

    // Assert
    expect(result).toEqual(["name", "address__street", "address__city"]);
  });

  it("should handle deeply nested object", () => {
    // Arrange
    const input = {
      name: "John",
      contact: {
        email: "john@example.com",
        phone: {
          home: "555-1234",
          work: "555-5678",
        },
      },
    };

    // Act
    const result = extractNestedKeys(input);

    // Assert
    expect(result).toEqual([
      "name",
      "contact__email",
      "contact__phone__home",
      "contact__phone__work",
    ]);
  });

  it("should handle empty object", () => {
    // Arrange
    const input = {};

    // Act
    const result = extractNestedKeys(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should ignore array values", () => {
    // Arrange
    const input = {
      name: "John",
      hobbies: ["reading", "gaming"],
      addresses: [{ street: "123 Main St" }, { street: "456 Oak Ave" }],
    };

    // Act
    const result = extractNestedKeys(input);

    // Assert
    expect(result).toEqual(["name", "hobbies", "addresses"]);
  });
});

describe("getNestedValue", () => {
  it("should get value from flat object", () => {
    // Arrange
    const input = {
      name: "John",
      age: 30,
      email: "john@example.com",
    };

    // Act
    const result = getNestedValue("name", input);

    // Assert
    expect(result).toBe("John");
  });

  it("should get value from nested object", () => {
    // Arrange
    const input = {
      name: "John",
      address: {
        street: "123 Main St",
        city: "Boston",
      },
    };

    // Act
    const result = getNestedValue("address__city", input);

    // Assert
    expect(result).toBe("Boston");
  });

  it("should get value from deeply nested object", () => {
    // Arrange
    const input = {
      name: "John",
      contact: {
        email: "john@example.com",
        phone: {
          home: "555-1234",
          work: "555-5678",
        },
      },
    };

    // Act
    const result = getNestedValue("contact__phone__home", input);

    // Assert
    expect(result).toBe("555-1234");
  });

  it("should return undefined for non-existent path", () => {
    // Arrange
    const input = {
      name: "John",
      address: {
        street: "123 Main St",
      },
    };

    // Act
    const result = getNestedValue("address__city", input);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should return undefined for non-existent nested path", () => {
    // Arrange
    const input = {
      name: "John",
    };

    // Act
    const result = getNestedValue("contact__phone__home", input);

    // Assert
    expect(result).toBeUndefined();
  });
});

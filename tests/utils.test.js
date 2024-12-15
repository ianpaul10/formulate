import { extractNestedKeys } from '../src/utils';

describe('extractNestedKeys', () => {
    test('should handle flat object', () => {
        // Arrange
        const input = {
            name: 'John',
            age: 30,
            email: 'john@example.com'
        };

        // Act
        const result = extractNestedKeys(input);

        // Assert
        expect(result).toEqual(['name', 'age', 'email']);
    });

    test('should handle nested object with single level', () => {
        // Arrange
        const input = {
            name: 'John',
            address: {
                street: '123 Main St',
                city: 'Boston'
            }
        };

        // Act
        const result = extractNestedKeys(input);

        // Assert
        expect(result).toEqual(['name', 'address__street', 'address__city']);
    });

    test('should handle deeply nested object', () => {
        // Arrange
        const input = {
            name: 'John',
            contact: {
                email: 'john@example.com',
                phone: {
                    home: '555-1234',
                    work: '555-5678'
                }
            }
        };

        // Act
        const result = extractNestedKeys(input);

        // Assert
        expect(result).toEqual([
            'name',
            'contact__email',
            'contact__phone__home',
            'contact__phone__work'
        ]);
    });

    test('should handle empty object', () => {
        // Arrange
        const input = {};

        // Act
        const result = extractNestedKeys(input);

        // Assert
        expect(result).toEqual([]);
    });

    test('should ignore array values', () => {
        // Arrange
        const input = {
            name: 'John',
            hobbies: ['reading', 'gaming'],
            addresses: [
                { street: '123 Main St' },
                { street: '456 Oak Ave' }
            ]
        };

        // Act
        const result = extractNestedKeys(input);

        // Assert
        expect(result).toEqual(['name', 'hobbies', 'addresses']);
    });
});

import { Apartment } from '@entities/apartment.entity';

describe('Apartment Entity', () => {
  it('should create an apartment with required properties', () => {
    const apartment = new Apartment();
    apartment.name = 'Seaside Apartment';
    apartment.description = 'Beautiful apartment with ocean view';
    apartment.price = 150.0;
    apartment.location = 'Beach District';
    apartment.numberOfBedrooms = 2;
    apartment.numberOfBathrooms = 1;
    apartment.squareMeters = 75;

    expect(apartment.name).toBe('Seaside Apartment');
    expect(apartment.description).toBe('Beautiful apartment with ocean view');
    expect(apartment.price).toBe(150.0);
    expect(apartment.location).toBe('Beach District');
    expect(apartment.numberOfBedrooms).toBe(2);
    expect(apartment.numberOfBathrooms).toBe(1);
    expect(apartment.squareMeters).toBe(75);
  });

  it('should allow optional amenities', () => {
    const apartment = new Apartment();
    apartment.name = 'City Apartment';
    apartment.price = 100.0;
    apartment.location = 'Downtown';
    apartment.numberOfBedrooms = 1;
    apartment.numberOfBathrooms = 1;
    apartment.squareMeters = 50;

    expect(apartment.amenities).toBeUndefined();

    apartment.amenities = ['WiFi', 'Kitchen', 'Balcony'];
    expect(apartment.amenities).toEqual(['WiFi', 'Kitchen', 'Balcony']);
  });

  it('should handle floor number', () => {
    const apartment = new Apartment();
    apartment.floor = 5;
    expect(apartment.floor).toBe(5);
  });

  it('should handle has elevator flag', () => {
    const apartment = new Apartment();
    apartment.hasElevator = true;
    expect(apartment.hasElevator).toBe(true);

    apartment.hasElevator = false;
    expect(apartment.hasElevator).toBe(false);
  });
});

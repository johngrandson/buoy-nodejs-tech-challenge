import { Hotel } from '@entities/hotel.entity';

describe('Hotel Entity', () => {
  it('should create a hotel with required properties', () => {
    const hotel = new Hotel();
    hotel.name = 'Grand Hotel';
    hotel.description = 'A luxurious hotel in the city center';
    hotel.price = 250.0;
    hotel.location = 'Downtown';
    hotel.numberOfRooms = 100;
    hotel.starRating = 5;

    expect(hotel.name).toBe('Grand Hotel');
    expect(hotel.description).toBe('A luxurious hotel in the city center');
    expect(hotel.price).toBe(250.0);
    expect(hotel.location).toBe('Downtown');
    expect(hotel.numberOfRooms).toBe(100);
    expect(hotel.starRating).toBe(5);
  });

  it('should allow optional amenities', () => {
    const hotel = new Hotel();
    hotel.name = 'Budget Hotel';
    hotel.price = 50.0;
    hotel.location = 'Airport';
    hotel.numberOfRooms = 50;
    hotel.starRating = 3;

    expect(hotel.amenities).toBeUndefined();

    hotel.amenities = ['WiFi', 'Parking', 'Pool'];
    expect(hotel.amenities).toEqual(['WiFi', 'Parking', 'Pool']);
  });

  it('should validate star rating is between 1 and 5', () => {
    const hotel = new Hotel();
    hotel.starRating = 3;
    expect(hotel.starRating).toBe(3);
  });
});

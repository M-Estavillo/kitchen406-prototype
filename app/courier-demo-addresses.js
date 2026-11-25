(() => {
 const addresses = [
  { add_line_1: '1 Demo Bakery Lane', barangay: 'Poblacion', city: 'Liloan', postal_code: '6002', latitude: 10.4002, longitude: 123.9958, distanceMeters: 2400, fee: 85 },
  { add_line_1: '2 Demo Market Lane', barangay: 'Poblacion', city: 'Consolacion', postal_code: '6001', latitude: 10.3767, longitude: 123.9567, distanceMeters: 6100, fee: 120 },
  { add_line_1: '3 Demo Harbor Lane', barangay: 'Poblacion', city: 'Danao', postal_code: '6004', latitude: 10.5208, longitude: 124.0275, distanceMeters: 16000, fee: 0 }
 ];
 if (typeof module === 'object') module.exports = addresses;
 else window.K406_DEMO_ADDRESSES = addresses;
})();

// Deterministic PRNG (Lehmer/Park-Miller) — ensures reproducible seed data
const _prngSeed = { value: 42 };
function seededRandom(): number {
  _prngSeed.value = (_prngSeed.value * 16807) % 2147483647;
  return (_prngSeed.value - 1) / 2147483646;
}

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';

const db = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Indian cities with coordinates
const CITIES: Record<string, { lat: number; lng: number }> = {
  BLR: { lat: 12.9716, lng: 77.5946 },
  MUM: { lat: 19.076, lng: 72.8777 },
  DEL: { lat: 28.7041, lng: 77.1025 },
  CHN: { lat: 13.0827, lng: 80.2707 },
  HYD: { lat: 17.385, lng: 78.4867 },
  KOL: { lat: 22.5726, lng: 88.3639 },
  PUNE: { lat: 18.5204, lng: 73.8567 },
};

// BLR landmarks
const BLR_LOCATIONS = [
  { name: "Majestic Bus Stand", lat: 12.9767, lng: 77.5713 },
  { name: "Koramangala", lat: 12.9352, lng: 77.6245 },
  { name: "Indiranagar", lat: 12.9784, lng: 77.6408 },
  { name: "Whitefield", lat: 12.9698, lng: 77.7500 },
  { name: "Electronic City", lat: 12.8440, lng: 77.6593 },
  { name: "MG Road", lat: 12.9756, lng: 77.6070 },
  { name: "HSR Layout", lat: 12.9116, lng: 77.6474 },
  { name: "Jayanagar", lat: 12.9250, lng: 77.5938 },
  { name: "Banashankari", lat: 12.9310, lng: 77.5488 },
  { name: "Hebbal", lat: 13.0358, lng: 77.5970 },
  { name: "Yelahanka", lat: 13.1007, lng: 77.5963 },
  { name: "Marathahalli", lat: 12.9591, lng: 77.6974 },
  { name: "BTM Layout", lat: 12.9166, lng: 77.6101 },
  { name: "JP Nagar", lat: 12.8920, lng: 77.5844 },
  { name: "Rajajinagar", lat: 12.9870, lng: 77.5533 },
  { name: "Basavanagudi", lat: 12.9416, lng: 77.5686 },
  { name: "Malleshwaram", lat: 12.9940, lng: 77.5713 },
  { name: "Peenya", lat: 13.0344, lng: 77.5031 },
  { name: "Silk Board", lat: 12.9177, lng: 77.6238 },
  { name: "KR Puram", lat: 12.9961, lng: 77.6856 },
  { name: "Bellandur", lat: 12.9308, lng: 77.6768 },
  { name: "Sarjapur Road", lat: 12.9100, lng: 77.6780 },
  { name: "Hennur", lat: 13.0275, lng: 77.6319 },
  { name: "Tumkur Road", lat: 13.0333, lng: 77.5344 },
  { name: "Hosur Road", lat: 12.8917, lng: 77.6410 },
  { name: "Bannerghatta Road", lat: 12.8880, lng: 77.5970 },
  { name: "Old Airport Road", lat: 12.9540, lng: 77.6973 },
  { name: "Cunningham Road", lat: 12.9783, lng: 77.5907 },
  { name: "Lavelle Road", lat: 12.9746, lng: 77.5867 },
  { name: "Richmond Road", lat: 12.9680, lng: 77.5969 },
  { name: "Brigade Road", lat: 12.9716, lng: 77.6070 },
  { name: "Church Street", lat: 12.9710, lng: 77.6041 },
  { name: "Residency Road", lat: 12.9670, lng: 77.6015 },
  { name: "Cubbon Park", lat: 12.9764, lng: 77.5929 },
  { name: "Vidhana Soudha", lat: 12.9798, lng: 77.5907 },
  { name: "Lalbagh", lat: 12.9507, lng: 77.5848 },
  { name: "City Market", lat: 12.9570, lng: 77.5743 },
  { name: "Shivajinagar", lat: 12.9840, lng: 77.5940 },
  { name: "Yeswanthpur", lat: 13.0390, lng: 77.5520 },
  { name: "Rajajinagar 2nd Stage", lat: 12.9910, lng: 77.5480 },
  { name: "Vijayanagar", lat: 12.9710, lng: 77.5300 },
  { name: "Bommanahalli", lat: 12.8920, lng: 77.6250 },
  { name: "Kengeri", lat: 12.9010, lng: 77.4840 },
  { name: "Mysore Road", lat: 12.9560, lng: 77.5300 },
  { name: "Magadi Road", lat: 12.9980, lng: 77.5260 },
  { name: "Yeshvantpur Industrial", lat: 13.0430, lng: 77.5430 },
  { name: "Nagasandra", lat: 13.0580, lng: 77.5250 },
  { name: "Bagalur", lat: 13.1200, lng: 77.6100 },
];

// MUM landmarks
const MUM_LOCATIONS = [
  { name: "Mumbai Central", lat: 18.9712, lng: 72.8196 },
  { name: "Andheri", lat: 19.1197, lng: 72.8464 },
  { name: "Bandra", lat: 19.0596, lng: 72.8295 },
  { name: "Juhu", lat: 19.0984, lng: 72.8263 },
  { name: "Dadar", lat: 19.0183, lng: 72.8438 },
  { name: "Thane", lat: 19.2183, lng: 72.9781 },
  { name: "Borivali", lat: 19.2307, lng: 72.8567 },
  { name: "Vashi", lat: 19.0745, lng: 72.9994 },
  { name: "Churchgate", lat: 18.9320, lng: 72.8265 },
  { name: "CSMT", lat: 18.9398, lng: 72.8355 },
  { name: "Lower Parel", lat: 19.0063, lng: 72.8325 },
  { name: "Powai", lat: 19.1260, lng: 72.9045 },
  { name: "Goregaon", lat: 19.1636, lng: 72.8526 },
  { name: "Malad", lat: 19.1790, lng: 72.8461 },
  { name: "Kandivali", lat: 19.2030, lng: 72.8497 },
  { name: "Bhandup", lat: 19.1529, lng: 72.9351 },
  { name: "Mulund", lat: 19.1745, lng: 72.9407 },
  { name: "Vikhroli", lat: 19.0804, lng: 72.9078 },
  { name: "Ghatkopar", lat: 19.0762, lng: 72.8975 },
  { name: "Kurla", lat: 19.0724, lng: 72.8804 },
];

// DEL landmarks
const DEL_LOCATIONS = [
  { name: "Connaught Place", lat: 28.6315, lng: 77.2167 },
  { name: "Karol Bagh", lat: 28.6519, lng: 77.1909 },
  { name: "Saket", lat: 28.5244, lng: 77.2066 },
  { name: "Dwarka", lat: 28.5733, lng: 77.0325 },
  { name: "Rohini", lat: 28.7321, lng: 77.1194 },
  { name: "Noida", lat: 28.5355, lng: 77.3910 },
  { name: "Gurgaon", lat: 28.4595, lng: 77.0266 },
  { name: "Lajpat Nagar", lat: 28.5700, lng: 77.2373 },
  { name: "Chandni Chowk", lat: 28.6507, lng: 77.2334 },
  { name: "AIIMS", lat: 28.5670, lng: 77.2100 },
  { name: "ISBT Kashmere Gate", lat: 28.6676, lng: 77.2284 },
  { name: "Rajouri Garden", lat: 28.6470, lng: 77.1190 },
  { name: "Pitampura", lat: 28.6994, lng: 77.1421 },
  { name: "Janakpuri", lat: 28.6196, lng: 77.0874 },
  { name: "Vasant Kunj", lat: 28.5265, lng: 77.1505 },
];

// CHN landmarks
const CHN_LOCATIONS = [
  { name: "Chennai Central", lat: 13.0827, lng: 80.2707 },
  { name: "T. Nagar", lat: 13.0418, lng: 80.2341 },
  { name: "Anna Nagar", lat: 13.0870, lng: 80.2080 },
  { name: "Adyar", lat: 13.0067, lng: 80.2572 },
  { name: "Velachery", lat: 12.9862, lng: 80.2186 },
  { name: "Porur", lat: 13.0345, lng: 80.1625 },
  { name: "Tambaram", lat: 12.9244, lng: 80.1273 },
  { name: "Guindy", lat: 13.0072, lng: 80.2209 },
  { name: "Nungambakkam", lat: 13.0645, lng: 80.2487 },
  { name: "Egmore", lat: 13.0765, lng: 80.2601 },
  { name: "Mylapore", lat: 13.0330, lng: 80.2628 },
  { name: "OMR", lat: 12.9120, lng: 80.2279 },
  { name: "ECR", lat: 12.8700, lng: 80.2590 },
  { name: "Chromepet", lat: 12.9516, lng: 80.1463 },
  { name: "Pallavaram", lat: 12.9680, lng: 80.1500 },
];

const INDIAN_FIRST_NAMES_M = ["Rajesh", "Suresh", "Mahesh", "Anand", "Vikram", "Arjun", "Pradeep", "Ravi", "Kiran", "Manish", "Deepak", "Sunil", "Sanjay", "Amit", "Rahul", "Ganesh", "Venkat", "Krishna", "Mohan", "Harish", "Naveen", "Sridhar", "Balaji", "Karthik", "Prakash", "Ashok", "Nandesh", "Ramesh", "Dinesh", "Senthil", "Murugan", "Kumar", "Satish", "Shankar", "Prabhu", "Jagdish", "Gurudev", "Narayan", "Bharath", "Chandra", "Rajendra", "Prabhakar", "Venkatesh", "Narasimha", "Srinivas", "Madhav", "Nikhil", "Varun", "Tarun", "Ajay", "Vijay", "Sachin", "Rohan", "Aditya"];
const INDIAN_FIRST_NAMES_F = ["Priya", "Lakshmi", "Sunita", "Kavitha", "Anjali", "Neha", "Pooja", "Ritu", "Meena", "Geeta", "Savitri", "Rekha", "Bhavani", "Divya", "Shalini", "Madhuri", "Aparna", "Sujatha", "Vijaya", "Padma", "Uma", "Saroja", "Kamala", "Jayanthi", "Nirmala", "Sudha", "Kalpana", "Rajeshwari", "Seetha", "Kumari", "Radha", "Padmini", "Chitra", "Vasanthi", "Rajeswari", "Santhi", "Deepa", "Manjula", "Latha", "Hema", "Sujatha", "Bharathi", "Renuka", "Annapurna", "Kalyani", "Mahalakshmi", "Ganga", "Yamuna"];
const INDIAN_LAST_NAMES = ["Kumar", "Sharma", "Patel", "Singh", "Rao", "Reddy", "Iyer", "Nair", "Gupta", "Verma", "Choudhury", "Mishra", "Joshi", "Ranganathan", "Subramanian", "Krishnamurthy", "Venkatesh", "Hegde", "Shetty", "Deshmukh", "Bhat", "Acharya", "Menon", "Pillai", "Kulkarni", "Desai", "Naik", "Gowda", "Prasad", "Babu", "Swamy", "Murthy", "Shastry", "Dikshit", "Pandey", "Agarwal", "Chopra", "Malhotra", "Kapoor", "Mehta"];

const BUS_PREFIXES = ["KA-01", "KA-02", "KA-03", "KA-05", "MH-01", "MH-02", "MH-03", "DL-01", "DL-02", "DL-03", "TN-01", "TN-02", "TN-03", "TN-04"];

function randomBetween(min: number, max: number) {
  return min + Math.floor(seededRandom() * (max - min + 1));
}

function randomFloat(min: number, max: number, decimals = 2) {
  return parseFloat((seededRandom() * (max - min) + min).toFixed(decimals));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)];
}

function generateRouteNumber(city: string, index: number): string {
  const prefixes: Record<string, string> = { BLR: "KIA", MUM: "BEST", DEL: "DTC", CHN: "MTC", intercity: "RTC" };
  return `${prefixes[city] || "BUS"}-${String(index).padStart(3, "0")}`;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function generateStops(startLoc: { name: string; lat: number; lng: number }, endLoc: { name: string; lat: number; lng: number }, numStops: number) {
  const stops = [{ name: startLoc.name, lat: startLoc.lat, lng: startLoc.lng }];
  for (let i = 1; i < numStops - 1; i++) {
    const t = i / (numStops - 1);
    stops.push({
      name: `Stop ${i}`,
      lat: startLoc.lat + (endLoc.lat - startLoc.lat) * t + (seededRandom() - 0.5) * 0.005,
      lng: startLoc.lng + (endLoc.lng - startLoc.lng) * t + (seededRandom() - 0.5) * 0.005,
    });
  }
  stops.push({ name: endLoc.name, lat: endLoc.lat, lng: endLoc.lng });
  return stops;
}

function getTrafficLevel(city: string): string {
  if (city === "BLR" || city === "MUM" || city === "DEL") {
    const r = seededRandom();
    return r < 0.3 ? "high" : r < 0.7 ? "medium" : "low";
  }
  return seededRandom() < 0.5 ? "medium" : "low";
}

function generateBusNumber(prefix: string): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const num = String(randomBetween(1000, 9999));
  const letter = letters[Math.floor(seededRandom() * letters.length)];
  return `${prefix}-${letter}${num}`;
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await db.routeAnalytics.deleteMany();
  await db.trafficAlert.deleteMany();
  await db.journey.deleteMany();
  await db.crewAssignment.deleteMany();
  await db.schedule.deleteMany();
  await db.notification.deleteMany();
  await db.auditLog.deleteMany();
  await db.busMaintenance.deleteMany();
  await db.holidayRequest.deleteMany();
  await db.crewProfile.deleteMany();
  await db.route.deleteMany();
  await db.profile.deleteMany();

  // 1. Create Admin
  const adminProfile = await db.profile.create({
    data: {
      email: "admin@bus.com",
      password: hashPassword("password123"),
      role: "admin",
      name: "System Administrator",
    },
  });
  console.log("✅ Admin created");

  // 2. Create Crew (60 drivers + 44 conductors = 104)
  const crewProfiles: { id: string; role: string; name: string; email: string }[] = [];
  
  for (let i = 1; i <= 60; i++) {
    const gender = seededRandom() > 0.1 ? "M" : "F";
    const firstName = gender === "M" ? pickRandom(INDIAN_FIRST_NAMES_M) : pickRandom(INDIAN_FIRST_NAMES_F);
    const lastName = pickRandom(INDIAN_LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const email = `driver${i}@bus.com`;

    const profile = await db.profile.create({
      data: {
        email,
        password: hashPassword("password123"),
        role: "driver",
        name,
      },
    });

    const cities = ["BLR", "MUM", "DEL", "CHN"];
    const city = pickRandom(cities);
    const prefix = BUS_PREFIXES.find(p => p.startsWith(city[0])) || "KA-01";

    await db.crewProfile.create({
      data: {
        profileId: profile.id,
        specialization: "driver",
        licenseNo: `DL${randomBetween(10000000, 99999999)}${randomBetween(1000, 9999)}`,
        experienceYears: randomBetween(1, 20),
        performanceRating: randomFloat(3.5, 5.0),
        availability: seededRandom() > 0.15 ? "available" : "on_leave",
        maxDailyHours: 8,
        busNumber: generateBusNumber(prefix),
      },
    });

    crewProfiles.push({ id: profile.id, role: "driver", name, email });
  }

  for (let i = 1; i <= 44; i++) {
    const gender = seededRandom() > 0.2 ? "M" : "F";
    const firstName = gender === "M" ? pickRandom(INDIAN_FIRST_NAMES_M) : pickRandom(INDIAN_FIRST_NAMES_F);
    const lastName = pickRandom(INDIAN_LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const email = `conductor${i}@bus.com`;

    const profile = await db.profile.create({
      data: {
        email,
        password: hashPassword("password123"),
        role: "conductor",
        name,
      },
    });

    await db.crewProfile.create({
      data: {
        profileId: profile.id,
        specialization: "conductor",
        licenseNo: `CL${randomBetween(10000000, 99999999)}`,
        experienceYears: randomBetween(1, 15),
        performanceRating: randomFloat(3.5, 5.0),
        availability: seededRandom() > 0.15 ? "available" : "on_leave",
        maxDailyHours: 8,
        busNumber: "",
      },
    });

    crewProfiles.push({ id: profile.id, role: "conductor", name, email });
  }
  console.log(`✅ ${crewProfiles.length} crew members created`);

  // 3. Create Customers (100)
  const customerProfiles: { id: string; name: string; email: string }[] = [];
  for (let i = 1; i <= 100; i++) {
    const gender = seededRandom() > 0.4 ? "M" : "F";
    const firstName = gender === "M" ? pickRandom(INDIAN_FIRST_NAMES_M) : pickRandom(INDIAN_FIRST_NAMES_F);
    const lastName = pickRandom(INDIAN_LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const email = `customer${i}@bus.com`;

    const profile = await db.profile.create({
      data: {
        email,
        password: hashPassword("password123"),
        role: "customer",
        name,
      },
    });

    customerProfiles.push({ id: profile.id, name, email });
  }
  console.log(`✅ ${customerProfiles.length} customers created`);

  // 4. Create Routes (115 total: 50 BLR, 20 MUM, 15 DEL, 15 CHN, 15 inter-city)
  const allRoutes: { id: string; city: string }[] = [];
  let routeIndex = 1;

  function createCityRoutes(locations: typeof BLR_LOCATIONS, city: string, count: number) {
    const usedPairs = new Set<string>();
    let created = 0;
    let attempts = 0;

    while (created < count && attempts < count * 10) {
      attempts++;
      const startIdx = Math.floor(seededRandom() * locations.length);
      let endIdx = Math.floor(seededRandom() * locations.length);
      if (startIdx === endIdx) continue;
      
      const pairKey = `${Math.min(startIdx, endIdx)}-${Math.max(startIdx, endIdx)}`;
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);

      const startLoc = locations[startIdx];
      const endLoc = locations[endIdx];
      const distance = calculateDistance(startLoc.lat, startLoc.lng, endLoc.lat, endLoc.lng);
      const adjustedDistance = distance * 1.3; // Road factor
      const durationMin = Math.round((adjustedDistance / 25) * 60); // ~25 km/h avg
      const fare = Math.round(20 + adjustedDistance * 2);
      const traffic = getTrafficLevel(city);
      const numStops = Math.min(Math.max(Math.round(adjustedDistance / 2), 3), 8);
      const stops = generateStops(startLoc, endLoc, numStops);
      const startTime = `${String(randomBetween(5, 8)).padStart(2, "0")}:00`;
      const endTime = `${String(randomBetween(20, 23)).padStart(2, "0")}:00`;
      const frequency = [15, 20, 30, 45, 60][Math.floor(seededRandom() * 5)];

      const prefix = BUS_PREFIXES.find(p => p.startsWith(city[0])) || "KA-01";

      const route = db.route.create({
        data: {
          routeNumber: generateRouteNumber(city, routeIndex),
          startLocation: startLoc.name,
          endLocation: endLoc.name,
          stopsJson: JSON.stringify(stops),
          distanceKm: Math.round(adjustedDistance * 10) / 10,
          durationMin,
          fare,
          trafficLevel: traffic,
          autoScheduleEnabled: seededRandom() > 0.3,
          startTime,
          endTime,
          frequencyMinutes: frequency,
          busRegistration: generateBusNumber(prefix),
          city,
          mapAvailable: true,
        },
      });

      routeIndex++;
      created++;
      return route;
    }
    return null;
  }

  // BLR routes (50)
  for (let i = 0; i < 50; i++) {
    const result = await createCityRoutes(BLR_LOCATIONS, "BLR", 1);
    if (result) allRoutes.push({ id: (await result).id, city: "BLR" });
  }

  // MUM routes (20)
  for (let i = 0; i < 20; i++) {
    const result = await createCityRoutes(MUM_LOCATIONS, "MUM", 1);
    if (result) allRoutes.push({ id: (await result).id, city: "MUM" });
  }

  // DEL routes (15)
  for (let i = 0; i < 15; i++) {
    const result = await createCityRoutes(DEL_LOCATIONS, "DEL", 1);
    if (result) allRoutes.push({ id: (await result).id, city: "DEL" });
  }

  // CHN routes (15)
  for (let i = 0; i < 15; i++) {
    const result = await createCityRoutes(CHN_LOCATIONS, "CHN", 1);
    if (result) allRoutes.push({ id: (await result).id, city: "CHN" });
  }

  // Inter-city routes (15)
  const interCityPairs = [
    { start: BLR_LOCATIONS[0], end: MUM_LOCATIONS[0] },
    { start: BLR_LOCATIONS[0], end: CHN_LOCATIONS[0] },
    { start: BLR_LOCATIONS[0], end: DEL_LOCATIONS[0] },
    { start: MUM_LOCATIONS[0], end: DEL_LOCATIONS[0] },
    { start: DEL_LOCATIONS[0], end: CHN_LOCATIONS[0] },
    { start: BLR_LOCATIONS[3], end: MUM_LOCATIONS[2] },
    { start: BLR_LOCATIONS[4], end: CHN_LOCATIONS[4] },
    { start: MUM_LOCATIONS[4], end: DEL_LOCATIONS[6] },
    { start: BLR_LOCATIONS[0], end: { name: "Hyderabad Central", lat: 17.385, lng: 78.4867 } },
    { start: MUM_LOCATIONS[0], end: { name: "Pune Station", lat: 18.5204, lng: 73.8567 } },
    { start: CHN_LOCATIONS[0], end: { name: "Kolkata Howrah", lat: 22.5726, lng: 88.3639 } },
    { start: BLR_LOCATIONS[2], end: MUM_LOCATIONS[3] },
    { start: DEL_LOCATIONS[0], end: BLR_LOCATIONS[0] },
    { start: CHN_LOCATIONS[6], end: BLR_LOCATIONS[4] },
    { start: DEL_LOCATIONS[6], end: MUM_LOCATIONS[0] },
  ];

  for (const pair of interCityPairs) {
    const distance = calculateDistance(pair.start.lat, pair.start.lng, pair.end.lat, pair.end.lng) * 1.2;
    const durationMin = Math.round((distance / 50) * 60);
    const fare = Math.round(200 + distance * 3);
    const stops = generateStops(pair.start, pair.end, 4);

    const route = await db.route.create({
      data: {
        routeNumber: `RTC-${String(routeIndex).padStart(3, "0")}`,
        startLocation: pair.start.name,
        endLocation: pair.end.name,
        stopsJson: JSON.stringify(stops),
        distanceKm: Math.round(distance * 10) / 10,
        durationMin,
        fare,
        trafficLevel: seededRandom() > 0.5 ? "medium" : "high",
        autoScheduleEnabled: true,
        startTime: "06:00",
        endTime: "23:00",
        frequencyMinutes: 120,
        busRegistration: generateBusNumber("KA-01"),
        city: "intercity",
        mapAvailable: true,
      },
    });
    allRoutes.push({ id: route.id, city: "intercity" });
    routeIndex++;
  }

  console.log(`✅ ${allRoutes.length} routes created`);

  // 5. Generate some schedules for today
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const schedulesCreated: string[] = [];

  for (const route of allRoutes) {
    const routeData = await db.route.findUnique({ where: { id: route.id } });
    if (!routeData || !routeData.autoScheduleEnabled) continue;

    const startTime = parseInt(routeData.startTime.split(":")[0]);
    const endTime = parseInt(routeData.endTime.split(":")[0]);
    const freq = routeData.frequencyMinutes;
    
    // Generate schedules for today and yesterday
    for (const date of [yesterday, today]) {
      for (let hour = startTime; hour < endTime; hour++) {
        for (let min = 0; min < 60; min += freq) {
          if (seededRandom() > 0.7) continue; // Don't create all possible schedules
          const timeStr = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
          
          let status = "scheduled";
          if (date === yesterday) {
            status = seededRandom() > 0.2 ? "completed" : "cancelled";
          } else {
            const currentHour = new Date().getHours();
            if (hour < currentHour - 1) status = seededRandom() > 0.1 ? "completed" : "cancelled";
            else if (hour === currentHour) status = "in_progress";
          }

          const schedule = await db.schedule.create({
            data: {
              routeId: route.id,
              date,
              departureTime: timeStr,
              status,
            },
          });
          schedulesCreated.push(schedule.id);
        }
      }
    }
  }
  console.log(`✅ ${schedulesCreated.length} schedules created`);

  // 6. Create some crew assignments
  const drivers = crewProfiles.filter(c => c.role === "driver");
  const conductors = crewProfiles.filter(c => c.role === "conductor");
  let assignmentCount = 0;

  for (const scheduleId of schedulesCreated) {
    if (seededRandom() > 0.6) continue;
    
    const driver = pickRandom(drivers);
    const conductor = pickRandom(conductors);

    await db.crewAssignment.createMany({
      data: [
        { scheduleId, crewId: driver.id, status: seededRandom() > 0.2 ? "accepted" : "pending" },
        { scheduleId, crewId: conductor.id, status: seededRandom() > 0.2 ? "accepted" : "pending" },
      ],
    });
    assignmentCount++;
  }
  console.log(`✅ ${assignmentCount * 2} crew assignments created`);

  // 7. Create some journeys
  let journeyCount = 0;
  for (const route of allRoutes.slice(0, 80)) {
    if (seededRandom() > 0.4) continue;
    
    const customer = pickRandom(customerProfiles);
    const routeSchedules = await db.schedule.findMany({
      where: { routeId: route.id, status: { in: ["completed", "in_progress"] } },
      take: 1,
    });
    
    if (routeSchedules.length === 0) continue;

    const routeData = await db.route.findUnique({ where: { id: route.id } });
    await db.journey.create({
      data: {
        customerId: customer.id,
        routeId: route.id,
        scheduleId: routeSchedules[0].id,
        status: routeSchedules[0].status === "completed" ? "completed" : "planned",
        cost: routeData?.fare || 50,
        rating: routeSchedules[0].status === "completed" ? randomBetween(3, 5) : null,
        feedback: routeSchedules[0].status === "completed" ? "Good service" : "",
      },
    });
    journeyCount++;
  }
  console.log(`✅ ${journeyCount} journeys created`);

  // 7b. Add 50 more completed journeys spread across last 30 days
  const completedFeedbacks = [
    "Good service, on time arrival.", "Bus was clean and comfortable.",
    "Driver was very polite.", "AC was not working properly.",
    "Reached destination on time.", "Crowded during peak hours.",
    "Smooth ride, no issues.", "Conductor was helpful.",
    "Slight delay due to traffic.", "Excellent experience overall.",
    "Bus frequency could be improved.", "Comfortable seating.",
    "Ticket price is reasonable.", "Need more stops on this route.",
    "Staff was courteous.", "Route was scenic and pleasant."
  ];
  for (let i = 0; i < 50; i++) {
    const route = pickRandom(allRoutes);
    const customer = pickRandom(customerProfiles);
    const routeSchedules = await db.schedule.findMany({
      where: { routeId: route.id, status: "completed" },
      take: 1,
    });
    if (routeSchedules.length === 0) continue;

    const routeData = await db.route.findUnique({ where: { id: route.id } });
    const daysAgo = randomBetween(1, 30);
    await db.journey.create({
      data: {
        customerId: customer.id,
        routeId: route.id,
        scheduleId: routeSchedules[0].id,
        status: "completed",
        cost: routeData?.fare || 50,
        rating: randomBetween(3, 5),
        feedback: pickRandom(completedFeedbacks),
        bookingDate: new Date(Date.now() - daysAgo * 86400000),
      },
    });
    journeyCount++;
  }
  console.log(`✅ ${journeyCount} total journeys (added 50 more completed)`);

  // 7c. Add 20 more planned journeys for today/tomorrow
  const today2 = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  for (let i = 0; i < 20; i++) {
    const route = pickRandom(allRoutes);
    const customer = pickRandom(customerProfiles);
    const routeSchedules = await db.schedule.findMany({
      where: { routeId: route.id, status: { in: ["scheduled", "in_progress"] }, date: { in: [today2, tomorrow] } },
      take: 1,
    });
    if (routeSchedules.length === 0) continue;

    const routeData = await db.route.findUnique({ where: { id: route.id } });
    await db.journey.create({
      data: {
        customerId: customer.id,
        routeId: route.id,
        scheduleId: routeSchedules[0].id,
        status: "planned",
        cost: routeData?.fare || 50,
        rating: null,
        feedback: "",
        bookingDate: new Date(),
      },
    });
    journeyCount++;
  }
  console.log(`✅ ${journeyCount} total journeys (added 20 more planned)`);

  // 8. Create some traffic alerts
  for (let i = 0; i < 15; i++) {
    const route = pickRandom(allRoutes);
    const reporter = pickRandom(crewProfiles);
    const types = ["congestion", "accident", "road_closure", "weather"];
    const severities = ["low", "medium", "high", "critical"];

    await db.trafficAlert.create({
      data: {
        routeId: route.id,
        reporterId: reporter.id,
        type: pickRandom(types),
        severity: pickRandom(severities),
        delayMinutes: randomBetween(5, 45),
        message: `Traffic ${pickRandom(["congestion", "delay", "issue"])} reported on this route`,
        createdAt: new Date(Date.now() - randomBetween(0, 86400000)),
        resolvedAt: seededRandom() > 0.5 ? new Date(Date.now() - randomBetween(0, 43200000)) : null,
      },
    });
  }
  console.log("✅ Traffic alerts created");

  // 9. Create some notifications
  for (const profile of [...customerProfiles.slice(0, 30), ...crewProfiles.slice(0, 20)]) {
    const types = ["info", "warning", "success"];
    await db.notification.create({
      data: {
        userId: profile.id,
        type: pickRandom(types),
        title: "Schedule Update",
        message: "Your schedule has been updated. Please check your dashboard.",
        isRead: seededRandom() > 0.5,
        createdAt: new Date(Date.now() - randomBetween(0, 86400000 * 3)),
      },
    });
  }
  console.log("✅ Notifications created");

  // 9b. Add 10 more notifications with varied types
  const extraNotifications = [
    { type: "warning", title: "Route Delay Alert", message: "Your route BEST-012 is experiencing delays of up to 15 minutes due to heavy traffic near Bandra." },
    { type: "success", title: "Trip Completed", message: "Your journey from Majestic to Whitefield has been completed successfully. Rate your experience!" },
    { type: "error", title: "Payment Failed", message: "Your payment of ₹85 for route DTC-005 could not be processed. Please retry." },
    { type: "info", title: "New Route Available", message: "A new intercity route RTC-045 from Bangalore to Hyderabad has been added. Book now!" },
    { type: "warning", title: "Schedule Change", message: "Your morning schedule on route KIA-007 has been moved from 06:30 to 07:00 starting next week." },
    { type: "success", title: "Leave Approved", message: "Your leave request for Dec 25-26 has been approved by the admin." },
    { type: "info", title: "Maintenance Reminder", message: "Bus KA-01-F4521 is due for routine maintenance on Jan 5. Please plan accordingly." },
    { type: "error", title: "Assignment Conflict", message: "You have been assigned to two overlapping schedules. Please contact dispatch." },
    { type: "success", title: "Monthly Rating", message: "Congratulations! Your performance rating for November is 4.8/5.0. Keep up the great work!" },
    { type: "warning", title: "Bus Breakdown", message: "Bus MH-02-B7893 has reported a breakdown on BEST-008. Alternate bus is being arranged." },
  ];
  for (const notif of extraNotifications) {
    const profile = pickRandom([...customerProfiles.slice(0, 20), ...crewProfiles.slice(0, 15)]);
    await db.notification.create({
      data: {
        userId: profile.id,
        type: notif.type as "info" | "warning" | "success" | "error",
        title: notif.title,
        message: notif.message,
        isRead: seededRandom() > 0.6,
        createdAt: new Date(Date.now() - randomBetween(0, 86400000 * 5)),
      },
    });
  }
  console.log("✅ 10 extra notifications created");

  // 10. Create some bus maintenance records
  for (let i = 0; i < 30; i++) {
    await db.busMaintenance.create({
      data: {
        busRegistration: generateBusNumber(pickRandom(BUS_PREFIXES)),
        serviceType: pickRandom(["routine", "repair", "inspection"]),
        date: new Date(Date.now() - randomBetween(0, 86400000 * 60)).toISOString().split("T")[0],
        cost: randomBetween(500, 15000),
        nextServiceDate: new Date(Date.now() + randomBetween(86400000 * 30, 86400000 * 180)).toISOString().split("T")[0],
        notes: pickRandom(["Oil change", "Brake service", "Tire rotation", "Engine checkup", "AC repair", "General inspection"]),
      },
    });
  }
  console.log("✅ Bus maintenance records created");

  // 11. Create route analytics
  for (const route of allRoutes.slice(0, 50)) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(Date.now() - d * 86400000).toISOString().split("T")[0];
      await db.routeAnalytics.create({
        data: {
          routeId: route.id,
          date,
          completionRate: randomFloat(0.7, 1.0),
          revenue: randomBetween(5000, 50000),
          delayMin: randomBetween(0, 30),
          totalJourneys: randomBetween(5, 40),
        },
      });
    }
  }
  console.log("✅ Route analytics created");

  // 11b. Fill route analytics gaps - ensure every route has analytics for last 7 days
  for (const route of allRoutes) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(Date.now() - d * 86400000).toISOString().split("T")[0];
      const existing = await db.routeAnalytics.findFirst({
        where: { routeId: route.id, date },
      });
      if (!existing) {
        const routeData = await db.route.findUnique({ where: { id: route.id } });
        const isWeekend = new Date(date).getDay() === 0 || new Date(date).getDay() === 6;
        const baseJourneys = isWeekend ? randomBetween(2, 20) : randomBetween(5, 40);
        await db.routeAnalytics.create({
          data: {
            routeId: route.id,
            date,
            completionRate: randomFloat(0.7, 1.0),
            revenue: Math.round((routeData?.fare || 50) * baseJourneys * randomFloat(0.6, 1.0)),
            delayMin: randomBetween(0, isWeekend ? 10 : 30),
            totalJourneys: baseJourneys,
          },
        });
      }
    }
  }
  console.log("✅ Route analytics gaps filled for all routes (last 7 days)");

  // 12. Create some holiday requests
  for (const crew of crewProfiles.slice(0, 20)) {
    await db.holidayRequest.create({
      data: {
        crewId: crew.id,
        startDate: new Date(Date.now() + randomBetween(86400000, 86400000 * 14)).toISOString().split("T")[0],
        endDate: new Date(Date.now() + randomBetween(86400000 * 2, 86400000 * 21)).toISOString().split("T")[0],
        reason: pickRandom(["Personal leave", "Family function", "Medical", "Travel", "Festival"]),
        status: pickRandom(["pending", "pending", "pending", "approved", "rejected"]),
        reviewedBy: seededRandom() > 0.5 ? adminProfile.id : null,
        reviewedAt: seededRandom() > 0.5 ? new Date() : null,
      },
    });
  }
  console.log("✅ Holiday requests created");

  // 13. Generate CREDENTIALS.txt
  const allProfiles = await db.profile.findMany({
    orderBy: [{ role: 'asc' }, { id: 'asc' }],
    select: { id: true, email: true, name: true, role: true }
  });

  let credText = `BusTrack Pro — Account Credentials\nGenerated: ${new Date().toISOString()}\nUniversal Password: password123\n${'='.repeat(60)}\n\n`;

  const roleGroups: Record<string, typeof allProfiles> = {};
  allProfiles.forEach(p => {
    if (!roleGroups[p.role]) roleGroups[p.role] = [];
    roleGroups[p.role].push(p);
  });

  for (const [role, profiles] of Object.entries(roleGroups)) {
    credText += `\n=== ${role.toUpperCase()} (${profiles.length} accounts) ===\n`;
    profiles.forEach((p, i) => {
      credText += `  ${i + 1}. ${p.email} — ${p.name}\n`;
    });
  }

  fs.writeFileSync('CREDENTIALS.txt', credText);
  console.log(`✅ Credentials written to CREDENTIALS.txt (${allProfiles.length} accounts)`);

  console.log("\n🎉 Database seeding completed!");
  console.log(`📊 Summary:`);
  console.log(`   - 1 Admin`);
  console.log(`   - 60 Drivers`);
  console.log(`   - 44 Conductors`);
  console.log(`   - 100 Customers`);
  console.log(`   - ${allRoutes.length} Routes`);
  console.log(`   - ${schedulesCreated.length} Schedules`);
  console.log(`   - ${journeyCount} Journeys`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

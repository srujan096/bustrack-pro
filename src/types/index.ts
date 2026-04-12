// ============================================================
// Bus Route & Crew Management System - Type Definitions
// ============================================================

export type UserRole = 'admin' | 'driver' | 'conductor' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrewProfile {
  id: string;
  profileId: string;
  specialization: 'driver' | 'conductor';
  licenseNo: string;
  experienceYears: number;
  performanceRating: number;
  availability: 'available' | 'on_leave' | 'unavailable';
  maxDailyHours: number;
  busNumber: string;
  profile?: UserProfile;
}

export interface Stop {
  name: string;
  lat: number;
  lng: number;
}

export interface Route {
  id: string;
  routeNumber: string;
  startLocation: string;
  endLocation: string;
  stopsJson: string;
  distanceKm: number;
  durationMin: number;
  fare: number;
  trafficLevel: 'low' | 'medium' | 'high';
  autoScheduleEnabled: boolean;
  startTime: string;
  endTime: string;
  frequencyMinutes: number;
  busRegistration: string;
  city: string;
  mapAvailable: boolean;
}

export type ScheduleStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Schedule {
  id: string;
  routeId: string;
  date: string;
  departureTime: string;
  status: ScheduleStatus;
  createdAt: string;
  route?: Route;
  crewAssignments?: CrewAssignment[];
}

export type AssignmentStatus = 'pending' | 'accepted' | 'declined' | 'completed';

export interface CrewAssignment {
  id: string;
  scheduleId: string;
  crewId: string;
  status: AssignmentStatus;
  assignedAt: string;
  completedAt: string | null;
  schedule?: Schedule & { route?: Route };
  crew?: UserProfile;
  crewProfile?: CrewProfile;
}

export type HolidayStatus = 'pending' | 'approved' | 'rejected';

export interface HolidayRequest {
  id: string;
  crewId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: HolidayStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  crew?: UserProfile;
}

export type JourneyStatus = 'planned' | 'completed' | 'cancelled';

export interface Journey {
  id: string;
  customerId: string;
  routeId: string;
  scheduleId: string;
  status: JourneyStatus;
  cost: number;
  rating: number | null;
  feedback: string;
  bookingDate: string;
  customer?: UserProfile;
  route?: Route;
  schedule?: Schedule;
}

export type TrafficType = 'congestion' | 'accident' | 'road_closure' | 'weather';
export type TrafficSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface TrafficAlert {
  id: string;
  routeId: string;
  reporterId: string;
  type: TrafficType;
  severity: TrafficSeverity;
  delayMinutes: number;
  message: string;
  createdAt: string;
  resolvedAt: string | null;
  route?: Route;
  reporter?: UserProfile;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface BusMaintenance {
  id: string;
  busRegistration: string;
  serviceType: string;
  date: string;
  cost: number;
  nextServiceDate: string;
  notes: string;
  createdAt: string;
}

export interface RouteAnalytics {
  id: string;
  routeId: string;
  date: string;
  completionRate: number;
  revenue: number;
  delayMin: number;
  totalJourneys: number;
  route?: Route;
}

// API Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserProfile;
  token: string;
}

export interface ApiError {
  error: string;
  details?: string;
}

export interface DashboardStats {
  totalRoutes: number;
  totalCrew: number;
  totalCustomers: number;
  todayJourneys: number;
  todayRevenue: number;
  activeSchedules: number;
  completedToday: number;
  activeAlerts: number;
}

export interface ScheduleGenerationResult {
  success: boolean;
  schedulesCreated: number;
  duplicatesSkipped: number;
  executionTimeMs: number;
  message: string;
}

export interface CrewAssignmentResult {
  success: boolean;
  assignmentsCreated: number;
  jainsIndex: number;
  maxHoursViolations: number;
  executionTimeMs: number;
  message: string;
}

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type AdminPage = 'dashboard' | 'routes' | 'schedules' | 'crew' | 'traffic' | 'holidays' | 'analytics' | 'maintenance';
export type CrewPage = 'dashboard' | 'assignments' | 'calendar' | 'holidays' | 'profile';
export type CustomerPage = 'dashboard' | 'search' | 'map' | 'bookings' | 'history';

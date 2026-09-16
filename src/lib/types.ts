export interface Destination {
  id: number;
  slug: string;
  name: string;
  state: string;
  tagline: string;
  categories: string[];
  lat: number;
  lng: number;
  rating: number;
  reviews_count: number;
  desc: string;
  best_time: string;
  budget: string;
  travel_mode: string;
  images: string[];
  popular: number;
}

export interface Experience {
  id: number;
  dest_slug: string;
  title: string;
  type: string;
  price: number;
  price_label: string;
  dur: string;
  desc: string;
  img: string;
}

export interface Guide {
  id: number;
  dest_slug: string;
  name: string;
  img: string;
  langs: string;
  years: number;
  fee: number;
  rating: number;
  verified: number;
  tagline: string;
  host_user_id?: number | null;
}

export interface Homestay {
  id: number;
  dest_slug: string;
  name: string;
  host: string;
  img: string;
  price: number;
  rating: number;
  tagline: string;
  images?: string[];
  host_user_id?: number | null;
}

// A local spot contributed by a guide host (saved in guide_places, shown on
// destination pages and inside the Plan Trip itinerary builder)
export interface GuidePlace {
  id: number;
  host_user_id: number | null;
  host_name: string;
  guide_id: number | null;
  dest_slug: string;
  title: string;
  desc: string;
  img: string;
  price: number;
  dur: string;
}

export interface Review {
  id: number;
  dest_slug: string;
  name: string;
  rating: number;
  text: string;
  created_at: string;
}

export interface TripItem {
  id: number;
  trip_id: number;
  day: number;
  time: string;
  title: string;
  dest_slug: string | null;
  kind: string;
  cost: number;
  done: number;
}

export interface Trip {
  id: number;
  user_id: number;
  name: string;
  start_date: string;
  end_date: string;
  interests: string[];
  budget: number;
  pace: string;
  status: string;
  items: TripItem[];
}

export interface Booking {
  id: number;
  kind: string;
  ref_id: number;
  title: string;
  dest_slug: string | null;
  host_user_id: number | null;
  date: string;
  guests: number;
  amount: number;
  status: string;
  note: string;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  city: string;
  phone: string;
  avatar: string;
  verification_status?: string; // none | pending | verified
}

export interface DestinationDetail {
  destination: Destination;
  experiences: Experience[];
  guides: Guide[];
  homestays: Homestay[];
  guide_places: GuidePlace[];
  reviews: Review[];
  saved: boolean;
}

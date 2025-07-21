// frontend/src/App.tsx
import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { BrowserRouter as Router } from "react-router-dom";
import { useDarkMode } from "./hooks/useDarkMode";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plane, ShieldCheck, Clock, Sun, Moon } from "lucide-react";

const AIRLINES = ["AA","DL","UA","WN","AS","B6","F9","NK","HA","SY","G4"];
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

export default function App() {
  const [theme, toggleTheme] = useDarkMode();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    pickupAddress: "",
    pickupDate: "",
    pickupTime: "",
    airline: "AA",
    flightNumber: "",
    confirmationNumber: "",
    bags: 1,
    hazItems: false,
    declarations: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]:
        type === "checkbox" ? checked
        : name === "bags"      ? Number(value)
        : value,
    }));
  };

  const submitBooking = async () => {
    if (!form.pickupDate || !form.pickupTime) {
      alert("Please select both pickup date and time.");
      return;
    }
    setLoading(true);
    try {
      const pickupISO = new Date(`${form.pickupDate}T${form.pickupTime}`).toISOString();
      const payload = { ...form, pickupTime: pickupISO };
      delete (payload as any).pickupDate;
      delete (payload as any).pickupTime;

      const { sessionId } = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(r => r.json());

      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe.js failed to load");
      await stripe.redirectToCheckout({ sessionId });
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  return (
    <Router>
      <div className={theme === "dark" ? "dark" : ""}>
        {/* Header */}
        <header className="fixed top-0 w-full h-16 z-50 bg-white dark:bg-black border-b dark:border-gray-800 shadow-md text-gray-800 dark:text-white">
          <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-4">
            <a href="#hero" className="text-2xl font-bold">Bag2Go</a>
            <nav className="flex items-center space-x-4 md:space-x-6 text-sm">
              {[
                ["booking", "Book"],
                ["how", "How It Works"],
                ["about", "About"],
                ["contact", "Contact"],
              ].map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400"
                >
                  {label}
                </a>
              ))}
              <a href="#drive">
                <Button variant="outline" size="sm" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-zinc-800">
                  Driver Sign-Up
                </Button>
              </a>
              <button onClick={toggleTheme} aria-label="Toggle theme">
                {theme === "dark"
                  ? <Sun size={20} className="text-yellow-400" />
                  : <Moon size={20} className="text-gray-800" />}
              </button>
            </nav>
          </div>
        </header>

        {/* Main */}
        <main className="pt-16 text-sm">
          {/* Hero + Booking */}
          <section
            id="hero"
            className="relative bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url("https://picsum.photos/seed/hero/1200/800")' }}
          >
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative z-10 container mx-auto px-4 text-center pt-2">
              <h2 className="text-4xl md:text-5xl font-extrabold text-emerald-500 dark:text-emerald-300">
                Breeze Through the Airport
              </h2>
              <p className="mt-3 text-base text-white/90">
                We handle your luggage pickup and check-in—go straight to TSA.
              </p>

              <div
                id="booking"
                className="scroll-mt-16 mt-4 max-w-xl mx-auto bg-white dark:bg-gray-900 p-4 md:p-6 rounded-lg shadow-lg space-y-3"
              >
                <h3 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100">
                  Book a Pickup
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} className="py-1 text-sm" />
                  <Input name="lastName"  placeholder="Last Name"  value={form.lastName}  onChange={handleChange} className="py-1 text-sm" />
                  <Input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className="py-1 text-sm" />
                  <Input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} className="py-1 text-sm" />
                  <Input name="pickupAddress" placeholder="Pickup Address" value={form.pickupAddress} onChange={handleChange} className="md:col-span-2 py-1 text-sm" />
                  <Input type="date" name="pickupDate" value={form.pickupDate} onChange={handleChange} className="py-1 text-sm" />
                  <Input type="time" name="pickupTime" value={form.pickupTime} onChange={handleChange} className="py-1 text-sm" />

                  {/* Always white background, black text */}
                  <select
                    name="airline"
                    value={form.airline}
                    onChange={handleChange}
                    className="border rounded px-2 py-1 bg-white text-black text-sm"
                  >
                    {AIRLINES.map(code => <option key={code}>{code}</option>)}
                  </select>

                  <Input name="flightNumber" placeholder="Flight #" value={form.flightNumber} onChange={handleChange} className="py-1 text-sm" />
                  <Input name="confirmationNumber" placeholder="Confirmation # / PNR" value={form.confirmationNumber} onChange={handleChange} className="py-1 text-sm" />
                  <Input type="number" name="bags" min="1" placeholder="# of Bags" value={form.bags} onChange={handleChange} className="py-1 text-sm" />

                  <label className="col-span-2 flex items-center space-x-2 text-sm dark:text-white">
                    <Checkbox name="hazItems" checked={form.hazItems} onChange={handleChange} className="w-5 h-5" />
                    <span>I have hazardous or declared items</span>
                  </label>

                  {form.hazItems && (
                    <Textarea
                      name="declarations"
                      placeholder="Describe items…"
                      value={form.declarations}
                      onChange={handleChange}
                      className="col-span-2 py-1 text-sm"
                    />
                  )}
                </div>
                <div className="mt-4 text-center">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 text-sm" onClick={submitBooking} disabled={loading}>
                    {loading ? "Redirecting…" : "Confirm & Pay"}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section
            id="how"
            className="scroll-mt-16 py-12 bg-gray-100 dark:bg-zinc-900 text-center"
          >
            <h3 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
              How It Works
            </h3>
            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
              {[
                { Icon: Plane, title: "Pickup & Check-In", desc: "We collect and check in your bags at the airport." },
                { Icon: ShieldCheck, title: "Secure & Insured", desc: "All luggage is sealed, monitored, and insured." },
                { Icon: Clock, title: "Save Time", desc: "Skip the desk and go straight to security." },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="p-4 bg-white dark:bg-zinc-800 rounded-lg shadow text-sm">
                  <Icon className="mx-auto text-emerald-500 dark:text-emerald-400" size={36} />
                  <h4 className="mt-3 font-bold text-lg text-gray-800 dark:text-gray-100">{title}</h4>
                  <p className="mt-2 text-gray-600 dark:text-white">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* About Section */}
          <section
            id="about"
            className="scroll-mt-16 py-12 bg-white dark:bg-zinc-800"
          >
            <div className="max-w-4xl mx-auto md:flex items-center gap-6 px-4">
              <img src="https://picsum.photos/seed/about/600/400" alt="About Bag2Go" className="rounded-lg shadow-md mb-6 md:mb-0" />
              <div>
                <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-gray-800 dark:text-white">
                  About Bag2Go
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Bag2Go revolutionizes air travel by offering reliable, efficient luggage pickup and check-in services, ensuring a hassle-free airport experience for every passenger.
                </p>
              </div>
            </div>
          </section>

          {/* Drive Section */}
          <section
            id="drive"
            className="scroll-mt-16 py-12 bg-gray-100 dark:bg-zinc-900 text-center"
          >
            <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-gray-800 dark:text-white">
              Become a Driver
            </h3>
            <p className="max-w-xl mx-auto mb-6 text-sm text-gray-700 dark:text-gray-300">
              Join our team and earn while helping travelers breeze through their journey.
            </p>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 text-sm" onClick={() => (window.location.hash = "#drive")}>
              Sign Up to Drive
            </Button>
          </section>

          {/* Contact Section */}
          <footer
            id="contact"
            className="scroll-mt-16 py-8 bg-gray-200 dark:bg-zinc-700 text-center"
          >
            <p className="text-sm text-gray-800 dark:text-gray-200">
              Have questions? Email us at{" "}
              <a href="mailto:support@bag2go.com" className="underline text-emerald-600 dark:text-emerald-400">
                support@bag2go.com
              </a>
            </p>
          </footer>
        </main>
      </div>
    </Router>
  );
}

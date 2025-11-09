// src/pages/About.jsx
import React from "react";
import { motion } from "framer-motion";
import "../styles/about.css";

function About() {
  const fadeUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const teamMembers = [
    { name: "Thabo Matlaletsa", role: "Founder & CEO", img: "https://randomuser.me/api/portraits/men/32.jpg" },
    { name: "Lerato Mokoena", role: "CTO", img: "https://randomuser.me/api/portraits/women/44.jpg" },
    { name: "Kabelo Khumalo", role: "Lead Designer", img: "https://randomuser.me/api/portraits/men/55.jpg" },
  ];

  const testimonials = [
    { name: "Mpho Thamae", text: "This platform helped me discover the right university and land my first job!" },
    { name: "Naledi Lekhooa", text: "Applying to courses and connecting with employers has never been easier." },
    { name: "Teboho Mohapi", text: "A seamless experience from registration to admission and employment." },
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <motion.h1 initial="hidden" animate="visible" variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0, transition: { duration: 1 } } }}>
            About Career Guidance & Employment Platform
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 1, delay: 0.3 } } }}>
            Connecting students with higher learning institutions and employers in Lesotho, providing guidance, opportunities, and career pathways.
          </motion.p>
        </div>
      </section>

      {/* Our Mission */}
      <section className="mission-section">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mission-content">
          <h2>Our Mission</h2>
          <p>
            Our mission is to empower students to make informed decisions about their education and careers,
            to simplify the admissions process, and to bridge the gap between graduates and companies seeking talent.
          </p>
          <img src="https://media.licdn.com/dms/image/v2/D4E12AQHgMxo-g7BYsw/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1658422953944?e=2147483647&v=beta&t=Z2tA86SPCvcG9ieACH8jr4SSL47dclFPchqYJIPI4gY" alt="Mission" className="mission-img" />
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="about-steps">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <motion.div className="step-card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <img src="https://cdn-icons-png.flaticon.com/512/747/747545.png" alt="Register" />
            <h3>Register</h3>
            <p>Create an account as a student, institution, or company to start your journey.</p>
          </motion.div>
          <motion.div className="step-card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="Apply" />
            <h3>Apply & Admit</h3>
            <p>Students apply to courses, institutions review applications, and admit qualified candidates.</p>
          </motion.div>
          <motion.div className="step-card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <img src="https://cdn-icons-png.flaticon.com/512/2910/2910765.png" alt="Connect" />
            <h3>Connect & Hire</h3>
            <p>Companies post opportunities and graduates apply, creating seamless employment connections.</p>
          </motion.div>
        </div>
      </section>

      {/* Our Team */}
      <section className="team-section">
        <h2 className="section-title">Meet Our Team</h2>
        <div className="team-container">
          {teamMembers.map((member, i) => (
            <motion.div className="team-card" key={i} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.2 }}>
              <img src={member.img} alt={member.name} className="team-img"/>
              <h4>{member.name}</h4>
              <p>{member.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <h2 className="section-title">What Our Users Say</h2>
        <div className="testimonials-container">
          {testimonials.map((test, i) => (
            <motion.div className="testimonial-card" key={i} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.2 }}>
              <p>"{test.text}"</p>
              <h4>- {test.name}</h4>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default About;

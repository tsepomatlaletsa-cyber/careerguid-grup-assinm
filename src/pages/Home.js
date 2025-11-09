import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/home.css";

function HomePage() {
  const fadeUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const steps = [
    {
      number: 1,
      title: "Register & Explore",
      desc: "Create an account as a student, institution, or company and set up your profile.",
      img: "https://cdn.wedevs.com/uploads/2018/12/User-Registration-WordPress-blog-feature-image.png",
    },
    {
      number: 2,
      title: "Apply & Admit",
      desc: "Students apply for courses, institutions review & admit; graduates upload transcripts and apply for jobs.",
      img: "https://www.volstate.edu/sites/default/files/2024-12/apply-now-400.jpg",
    },
    {
      number: 3,
      title: "Connect & Hire",
      desc: "Companies post job opportunities; qualified graduates receive notifications and apply.",
      img: "https://blog.coursera.org/wp-content/uploads/2023/04/Coursera-Hiring-Solutions_Blog.png",
    },
  ];

  return (
    <div className="home-page">
      {/* Hero Section with inline background */}
      <section
        className="hero-section"
        style={{
          position: "relative",
          height: "90vh",
          backgroundImage: `url('https://mantechpublications.com/wp-content/uploads/2024/11/1-7-1024x1024.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "white",
        }}
      >
        <div
          className="hero-overlay"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
          }}
        ></div>

        <div
          className="hero-content"
          style={{
            position: "relative",
            zIndex: 10,
            maxWidth: 700,
            padding: "2rem",
          }}
        >
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0, transition: { duration: 1 } } }}
          >
            Discover Higher Learning Institutions & Connect With Employers
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 1, delay: 0.3 } } }}
          >
            Helping high school students in Lesotho explore institutions, apply for courses,
            and connect with companies for employment opportunities.
          </motion.p>
          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Link to="/register" className="btn btn-primary">Register</Link>
            <Link to="/login" className="btn btn-secondary">Login</Link>
          </motion.div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="steps-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          {steps.map((step) => (
            <motion.div
              className="step"
              key={step.number}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
            >
              <div className="step-image-container">
                <img src={step.img} alt={step.title} className="step-image" />
              </div>
              <div className="step-number">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Explore Section */}
      <section className="explore-section">
        <motion.h2
          className="section-title"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          Explore Institutions & Companies
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          Find the best universities, faculties, and programs in Lesotho.
        </motion.p>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <Link to="/institutions" className="btn btn-primary">View Institutions</Link>
        </motion.div>
      </section>

      {/* Why Section */}
      <section className="why-section">
        <h2 className="section-title">Why Choose Our Platform</h2>
        <div className="features-list">
          {[
            { title: "Comprehensive Coverage", desc: "All institutions and courses managed centrally." },
            { title: "Seamless Admissions", desc: "Institutions monitor applications and statuses easily." },
            { title: "Employer Integration", desc: "Graduates upload transcripts and get connected to companies." },
            { title: "Role‑Based Access", desc: "Students, institutions, and companies each have dedicated modules." }
          ].map((feature, i) => (
            <motion.div
              className="feature"
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
            >
              <h4>{feature.title}</h4>
              <p>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          Ready to get started?
        </motion.h2>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link to="/register" className="btn btn-secondary btn-cta">Sign Up Now</Link>
        </motion.div>
      </section>
    </div>
  );
}

export default HomePage;

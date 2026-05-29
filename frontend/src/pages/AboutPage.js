import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/about.css';

function AboutPage() {
  const location = useLocation();
  const [currentAwardIndex, setCurrentAwardIndex] = useState(0);

  useEffect(() => {
    // Handle hash scrolling to contact section
    if (location.hash === '#contact-us') {
      setTimeout(() => {
        const element = document.getElementById('contact-us');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.hash]);

  const awards = [
    'DAIKIN 6TH YEAR TEN MILLION PESO SALES AWARD.',
    'DAIKIN ELITE VRV CLUB MEMBER.',
    'TOP 10 MIDEA BUILDING TECHNOLOGIES (MBT) SALES AWARDEE 2022.',
    'DAIKIN BEST IN SKY AIR (SA) SALES 2019 (2ND PLACE).',
    'DAIKIN BEST IN SKY AIR (SA) SALES 2017 (2ND PLACE).',
    'DAIKIN BEST IN AIR PURIFIER (APU) SALES 2020 (1ST PLACE).',
  ];

  const handleLeftArrow = () => {
    setCurrentAwardIndex((prev) => (prev === 0 ? awards.length - 1 : prev - 1));
  };

  const handleRightArrow = () => {
    setCurrentAwardIndex((prev) => (prev === awards.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="about-page">
      <Header />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-wrapper">
          <span className="arrow left" onClick={() => {}}>
            &#8249;
          </span>

          <div className="hero-image">
            <img src="/assets/vapic.png" alt="VA Industrial" />
          </div>

          <div className="hero-text">
            <h2>
              VA INDUSTRIAL <br /> ELECTRICAL SERVICES
            </h2>
            <p>
              VA Industrial Electrical Services is a motor rewinding and air-conditioning company that has been established since 1997. We are in the industrial field where we offer air conditioning services such as supply and installation, preventive maintenance, troubleshooting and repair of air conditioning units. We offer motor rewinding and reconditioning with surge testing, lathe machining, high index polarization test, and more. Our electrical services also include the preventive maintenance and repair of transformers and generators, and trading of air conditioning materials and parts.
            </p>
          </div>

          <span className="arrow right" onClick={() => {}}>
            &#8250;
          </span>
        </div>
      </section>

      {/* Blue Value Section */}
      <section className="blue-section">
        <h2>Count on VA INDUSTRIAL to look after your motor rewinding and air-conditioning needs.</h2>
        <div className="line"></div>

        <div className="icon-row">
          <div className="icon-item">
            <div className="icon-circle">
              <img src="/assets/icon1.jpg" alt="Reliability" />
            </div>
          </div>

          <div className="icon-item">
            <div className="icon-circle">
              <img src="/assets/icon2.jpg" alt="Quality Service" />
            </div>
          </div>

          <div className="icon-item">
            <div className="icon-circle">
              <img src="/assets/icon3.jpg" alt="Timely Delivery" />
            </div>
          </div>

          <div className="icon-item">
            <div className="icon-circle">
              <img src="/assets/icon4.jpg" alt="High Standards" />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services">
        <div className="services-left">
          <div className="img-box img1">
            <img src="/assets/1.jpg" alt="Service 1" />
          </div>
          <div className="img-box img2">
            <img src="/assets/2.jpg" alt="Service 2" />
          </div>
          <div className="img-box img3">
            <img src="/assets/3.jpg" alt="Service 3" />
          </div>
        </div>

        <div className="services-right">
          <h3>Our Services</h3>
          <div className="line-small"></div>

          <p>
            VA industrial is engaged in dealing services in the field of Industrial Maintenance, Electrical Motor Rewinding, and Air-conditioning.
          </p>
        </div>
      </section>

      {/* Aircon Brands */}
      <section className="aircon-brands-header">
        <h2>Aircon Brands</h2>
        <div className="line-center"></div>
      </section>

      <section className="content-section">
        <div className="img-large">
          <img src="/assets/brands.png" alt="Aircon Brands" />
        </div>
      </section>

      {/* Training and Seminars */}
      <section className="content-section">
        <div className="section-title">
          <h3>
            Training and <br /> Seminars
          </h3>
          <div className="line-small"></div>
        </div>

        <div className="img-large">
          <img src="/assets/seminars.png" alt="Training and Seminars" />
        </div>
      </section>

      {/* Daikin Academy Certificates */}
      <section className="content-section">
        <div className="section-title right">
          <h3>
            Daikin Academy <br /> Certificates
          </h3>
          <div className="line-small"></div>
        </div>

        <div className="img-large">
          <img src="/assets/certs.png" alt="Daikin Academy Certificates" />
        </div>
      </section>

      {/* TESDA */}
      <section className="content-section">
        <div className="tesda-row">
          <div className="tesda-col">
            <h3>Tesda NCIII</h3>
            <div className="line-small"></div>
            <div className="img-small">
              <img src="/assets/tesda1.jpg" alt="Tesda NCIII 1" />
              <img src="/assets/tesda2.jpg" alt="Tesda NCIII 2" />
              <img src="/assets/tesda3.jpg" alt="Tesda NCIII 3" />
            </div>
          </div>

          <div className="tesda-col">
            <h3>Tesda NCII</h3>
            <div className="line-small"></div>
            <div className="img-small">
              <img src="/assets/tesda4.jpg" alt="Tesda NCII 1" />
              <img src="/assets/tesda5.jpg" alt="Tesda NCII 2" />
              <img src="/assets/tesda6.jpg" alt="Tesda NCII 3" />
            </div>
          </div>
        </div>
      </section>

      {/* Awards Section */}
      <section className="awards-section">
        <div className="awards-header">
          <h2>Awards</h2>
          <div className="line-center-white"></div>
        </div>

        <div className="awards-content">
          <span className="arrow-awards left-awards" onClick={handleLeftArrow}>
            &#8249;
          </span>

          <div className="awards-img">
            <img id="awardsSlider" src="/assets/awards.jpg" alt="Awards" />
          </div>

          <span className="arrow-awards right-awards" onClick={handleRightArrow}>
            &#8250;
          </span>

          <ul className="awards-list">
            {awards.map((award, index) => (
              <li key={index}>{award}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact-us" className="contact-section">
        <h2>CONTACT US</h2>
        <div className="line-center-gray"></div>
        <p className="contact-desc">09365946625 / 09391653673</p>

        <div className="contact-row">
          <div className="contact-block">
            <img className="contact-icon" src="/assets/add.png" alt="Add" />
            <ul>
              <li>Supply & Installation of airconditioning units & parts</li>
              <li>Preventive Maintenance, Troubleshooting & Repair</li>
              <li>Preventive Maintenance of Plant Ventilation</li>
              <li>Fabrication of ducting, panel housing, evaporator & condenser oil</li>
            </ul>
          </div>

          <div className="contact-block">
            <img className="contact-icon" src="/assets/adds.png" alt="Adds" />
            <ul>
              <li>Dynamic Balancing & Surge Testing</li>
              <li>Sheet metal works</li>
              <li>Lathe Machining works</li>
              <li>Industrial motor rewinding AC/DC from fractional up to 300HP and larger</li>
              <li>With 3 phase power supply that can test up to 250HP and larger</li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default AboutPage;

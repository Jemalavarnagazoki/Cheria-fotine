import { Link } from 'react-router-dom'

const Home = ({ language }: { language: 'ka' | 'en' }) => {
  const isGeorgian = language === 'ka'

  return (
    <section className="landing">
      <div className="hero">
        <div className="hero-card">
          <h1 className="hero-title">
            {isGeorgian ? 'ხელნაკეთი ჩერია' : 'Handmade Cheria Crochet'}
          </h1>
          <p className="hero-text">
            {isGeorgian
              ? 'თბილი ბალაკლავები, რბილი სვიტერები და აქსესუარები — ყველაფერი ხელნაკეთია და მცირე რაოდენობით მზადდება.'
              : 'Cozy balaclavas, soft sweaters, and warm accessories crocheted by hand. Each piece is crafted in small batches with careful detail.'}
          </p>
          <div className="cta-row">
            <Link className="primary-button" to="/category/balaclavas">
              {isGeorgian ? 'ნახე პროდუქტები' : 'View products'}
            </Link>
            <span className="soft-note">
              {isGeorgian ? 'ახალი კოლექცია ყოველ თვეში.' : 'New drops monthly.'}
            </span>
          </div>
        </div>
        <div className="hero-card">
          <h2 className="hero-title">
            {isGeorgian ? 'რას გთავაზობთ' : 'What we offer'}
          </h2>
          <p className="hero-text">
            {isGeorgian
              ? 'ბალაკლავები, ქუდები, შარფები, ხელთათმანები და სვიტერ-ჟაკეტები — თბილი და განსხვავებული ხელნაკეთი სტილი.'
              : 'Balaclavas, hats, scarves, gloves, and sweater jackets designed for cozy layering and a distinctive handmade look.'}
          </p>
          <div className="tag-row">
            <span className="tag">{isGeorgian ? 'ბალაკლავები' : 'Balaclavas'}</span>
            <span className="tag">{isGeorgian ? 'სვიტერები' : 'Sweaters'}</span>
            <span className="tag">{isGeorgian ? 'აქსესუარები' : 'Accessories'}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Home

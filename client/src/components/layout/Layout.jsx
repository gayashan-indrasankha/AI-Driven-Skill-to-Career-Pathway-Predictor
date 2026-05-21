import Navbar from './Navbar'
import Footer from './Footer'

const Layout = ({ children }) => {
  return (
    <div className="page-container">
      {/* Digital grid background */}
      <div className="grid-background" />
      {/* Scanline effect */}
      <div className="scanline" />
      {/* Navigation */}
      <Navbar />
      {/* Main content */}
      <main className="main-content">
        {children}
      </main>
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Layout

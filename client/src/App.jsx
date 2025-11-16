import React from 'react'
import { Routes,Route } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home.jsx'
import BuyCredits from './pages/BuyCredits.jsx'
import Result from './pages/Result.jsx'
import Navbar from './components/Navbar'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Login from './components/Login.jsx'
import { useContext } from 'react'
import { AppContext } from './context/AppContext.jsx'
const App = () => {
const {showLogin}=useContext(AppContext)
return (
<div className="px-4 sm:px-10 md:px-14 lg:px-28 min-h-screen bg-gradient-to-b from-tan-50 to bg-orange-50">
<ToastContainer position='bottom right'/>    
<Navbar/>
{showLogin && <Login/>}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/buy-credits" element={<BuyCredits />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    <Footer/>
    
    </div>
  )
}

export default App

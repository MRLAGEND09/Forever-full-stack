import React from 'react'
import {Routes,Route} from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/home.jsx'
import Collection from './pages/collection.jsx'
import Contact from './pages/contact.jsx'
import Login from './pages/login.jsx'
import About from './pages/about.jsx'
import Cart from './pages/cart.jsx'
import Order from './pages/order.jsx'
import Product from './pages/product.jsx'
import PlaceOrder from './pages/placeOrder.jsx'
import Verify from './pages/verify.jsx'
import Navbar from './components/navbar.jsx';
import SearchBar from './components/searchBar.jsx';
import Footer from './components/footer.jsx';
const App = () => {
  return (
    <div className='px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'>
      <ToastContainer />
      <Navbar />
      <SearchBar />
      <Routes>
       <Route path='/' element={<Home/>} />
       <Route path='/collection' element={<Collection/>} />
       <Route path='/contact' element={<Contact/>} />
       <Route path='/login' element={<Login/>} />
       <Route path='/about' element={<About/>} />
       <Route path='/cart' element={<Cart/>} />
       <Route path='/order' element={<Order/>} />
       <Route path='/product/:productid' element={<Product/>} />
       <Route path='/place-order' element={<PlaceOrder/>} />
       <Route path='/verify' element={<Verify/>} />
      </Routes>
      <Footer />

    </div>
  )
}

export default App

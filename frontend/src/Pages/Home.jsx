import React, { useContext, useEffect, useState } from 'react'
import Hero from '../components/Hero'
import LatestCollection from '../components/LatestCollection'
import BestSeller from '../components/BestSeller'
import OurPolicy from '../components/OurPolicy'
import NewsletterBox from '../components/NewsletterBox'
import CollectionSection from '../components/CollectionSection'
import PersonalizedHomeSections from '../components/PersonalizedHomeSections'
import { ShopContext } from '../context/ShopContext'

const Home = () => {
  const { getAbVariant } = useContext(ShopContext)
  const [variant, setVariant] = useState('A')

  useEffect(() => {
    getAbVariant('homepage-layout').then((value) => setVariant(value))
  }, [])

  return (
    <div>
      <Hero />
      <PersonalizedHomeSections />
      {variant === 'A' ? <LatestCollection /> : <BestSeller />}
      <CollectionSection collectionKey='boss' title1='BOSS' title2='COLLECTION' />
      <CollectionSection collectionKey='lacoste' title1='LACOSTE' title2='COLLECTION' />
      <CollectionSection collectionKey='ralph-lauren' title1='RALPH LAUREN' title2='COLLECTION' />
      <CollectionSection collectionKey='jacket' title1='JACKET' title2='COLLECTION' />
      <CollectionSection collectionKey='bloop' title1='BLOOP' title2='COLLECTION' />
      {variant === 'A' ? <BestSeller /> : <LatestCollection />}
      <OurPolicy />
      <NewsletterBox />
    </div>
  )
}

export default Home
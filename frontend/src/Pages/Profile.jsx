import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import '@fortawesome/fontawesome-free/css/all.min.css'

const Profile = () => {
    const { token, backendUrl, userInfo, setUserInfo, navigate, currency, setToken, setCartItems } = useContext(ShopContext)
    const [orders, setOrders] = useState([])
    const [activeTab, setActiveTab] = useState('profile')
    const [editing, setEditing] = useState(false)
    const [name, setName] = useState('')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deletePassword, setDeletePassword] = useState('')
    const [loading, setLoading] = useState(true)
    const [address, setAddress] = useState({
        street: '', city: '', state: '', zipcode: '', country: '', phone: ''
    })

    useEffect(() => {
        const savedToken = token || localStorage.getItem('token')
        if (!savedToken) {
            navigate('/login')
            return
        }
        if (userInfo) {
            setName(userInfo.name || '')
            if (userInfo.address) {
                setAddress(userInfo.address)
            }
            setLoading(false)
        } else {
            // userInfo is not yet loaded, set a timer to check again after 2 seconds
            const timer = setTimeout(() => {
                if (!userInfo) setLoading(false)
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [token, userInfo])



    const fetchOrders = async () => {
        try {
            const res = await axios.post(backendUrl + '/api/order/userorders', {}, { headers: { token } })
            if (res.data.success) {
                setOrders(res.data.orders.reverse())
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (activeTab === 'orders') fetchOrders()
    }, [activeTab])

    const updateProfile = async () => {
        try {
            const res = await axios.post(backendUrl + '/api/user/update-profile', { name, address }, { headers: { token } })
            if (res.data.success) {
                setUserInfo(prev => ({ ...prev, name, address }))
                setEditing(false)
                toast.success('Profile updated!')
            } else {
                toast.error(res.data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const changePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match!')
            return
        }
        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters!')
            return
        }
        try {
            const res = await axios.post(backendUrl + '/api/user/change-password', { currentPassword, newPassword }, { headers: { token } })
            if (res.data.success) {
                toast.success('Password changed successfully!')
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            } else {
                toast.error(res.data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        toast.info('Uploading...')
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = async () => {
            try {
                const res = await axios.post(backendUrl + '/api/user/upload-avatar', {
                    avatarBase64: reader.result
                }, { headers: { token } })
                if (res.data.success) {
                    setUserInfo(prev => ({ ...prev, avatar: res.data.avatar }))
                    toast.success('Profile picture updated!')
                } else {
                    toast.error(res.data.message)
                }
            } catch (error) {
                toast.error('Failed to upload image!')
            }
        }
    }

    const deleteAddress = async () => {
        if (!window.confirm('Are you sure you want to delete your address?')) return
        try {
            const res = await axios.post(backendUrl + '/api/user/delete-address', {}, { headers: { token } })
            if (res.data.success) {
                setUserInfo(prev => ({ ...prev, address: { street: '', city: '', state: '', zipcode: '', country: '', phone: '' } }))
                setAddress({ street: '', city: '', state: '', zipcode: '', country: '', phone: '' })
                toast.success('Address deleted!')
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const deleteAccount = async () => {
        if (userInfo?.provider === 'manual' && !deletePassword) {
            toast.error('Please enter your password to confirm!')
            return
        }
        try {
            const res = await axios.post(backendUrl + '/api/user/delete-account', {
                password: deletePassword
            }, { headers: { token } })
            if (res.data.success) {
                toast.success('Account deleted successfully!')
                localStorage.removeItem('token')
                setToken('')
                setCartItems({})
                setUserInfo(null)
                navigate('/')
            } else {
                toast.error(res.data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'Order Placed': return 'text-yellow-500'
            case 'Shipped': return 'text-blue-500'
            case 'Out For Delivery': return 'text-orange-500'
            case 'Delivered': return 'text-green-500'
            case 'Cancelled': return 'text-red-500'
            default: return 'text-gray-500'
        }
    }


    if (loading) {
        return (
            <div className='border-t pt-14 min-h-[80vh] flex items-center justify-center'>
                <p className='text-gray-400'><i className='fas fa-spinner fa-spin mr-2'></i>Loading profile...</p>
            </div>
        )
    }

    return (
        <div className='border-t pt-14 min-h-[80vh]'>
            <div className='max-w-4xl mx-auto'>

                {/* Profile Header */}
                <div className='flex items-center gap-6 mb-8 p-6 bg-gray-50 rounded-lg'>
                    {userInfo?.avatar ? (
                        <img src={userInfo.avatar} className='w-20 h-20 rounded-full object-cover border-4 border-white shadow-md' alt="" />
                    ) : (
                        <div className='w-20 h-20 rounded-full bg-black text-white flex items-center justify-center text-3xl font-medium shadow-md'>
                            {userInfo?.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h2 className='text-2xl font-semibold'>{userInfo?.name}</h2>
                        <p className='text-gray-500'>{userInfo?.email}</p>
                        {userInfo?.address?.phone && (
                            <p className='text-gray-500 text-sm mt-1'>
                                <i className='fas fa-phone mr-1'></i>{userInfo.address.phone}
                            </p>
                        )}
                        <p className='text-xs text-gray-400 mt-1 capitalize'>
                            <i className={`fab fa-${userInfo?.provider === 'google' ? 'google text-red-400' : userInfo?.provider === 'facebook' ? 'facebook text-blue-500' : 'user text-gray-400'} mr-1`}></i>
                            {userInfo?.provider === 'manual' ? 'Email account' : `${userInfo?.provider} account`}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className='flex gap-2 mb-6 border-b'>
                    {['profile', 'orders', 'password', 'address'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm capitalize ${activeTab === tab ? 'border-b-2 border-black font-medium' : 'text-gray-500'}`}
                        >
                            {tab === 'profile' && <i className='fas fa-user mr-1'></i>}
                            {tab === 'orders' && <i className='fas fa-box mr-1'></i>}
                            {tab === 'password' && <i className='fas fa-lock mr-1'></i>}
                            {tab === 'address' && <i className='fas fa-map-marker-alt mr-1'></i>}
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className='flex flex-col gap-4'>
                        <div className='bg-white border rounded-lg p-6'>
                            <div className='flex justify-between items-center mb-4'>
                                <h3 className='text-lg font-medium'>Personal Information</h3>
                                <button onClick={() => setEditing(!editing)} className='text-sm text-gray-500 hover:text-black'>
                                    <i className={`fas fa-${editing ? 'times' : 'edit'} mr-1`}></i>
                                    {editing ? 'Cancel' : 'Edit'}
                                </button>
                            </div>
                            <div className='flex flex-col gap-4'>
                                {userInfo?.provider === 'manual' && (
                                    <div>
                                        <p className='text-sm text-gray-500 mb-2'>Profile Picture</p>
                                        <div className='flex items-center gap-4'>
                                            {userInfo?.avatar ? (
                                                <img src={userInfo.avatar} className='w-16 h-16 rounded-full object-cover' alt="" />
                                            ) : (
                                                <div className='w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-2xl'>
                                                    {userInfo?.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            {editing && (
                                                <label className='cursor-pointer bg-gray-100 border px-4 py-2 text-sm hover:bg-gray-200'>
                                                    <i className='fas fa-upload mr-2'></i>Upload Photo
                                                    <input type='file' accept='image/*' hidden onChange={handleAvatarUpload} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <p className='text-sm text-gray-500 mb-1'>Full Name</p>
                                    {editing ? (
                                        <input value={name} onChange={(e) => setName(e.target.value)} className='border px-3 py-2 w-full max-w-sm' />
                                    ) : (
                                        <p className='font-medium'>{userInfo?.name}</p>
                                    )}
                                </div>

                                <div>
                                    <p className='text-sm text-gray-500 mb-1'>Email</p>
                                    <p className='font-medium'>{userInfo?.email}</p>
                                </div>

                                {!editing && userInfo?.address?.phone && (
                                    <div>
                                        <p className='text-sm text-gray-500 mb-1'>Phone</p>
                                        <p className='font-medium'>{userInfo.address.phone}</p>
                                    </div>
                                )}
                                {!editing && userInfo?.address?.street && (
                                    <div>
                                        <p className='text-sm text-gray-500 mb-1'>Address</p>
                                        <p className='font-medium'>
                                            {userInfo.address.street}, {userInfo.address.city}, {userInfo.address.state}, {userInfo.address.country} - {userInfo.address.zipcode}
                                        </p>
                                    </div>
                                )}

                                {editing && (
                                    <button onClick={updateProfile} className='bg-black text-white px-6 py-2 text-sm w-fit'>
                                        Save Changes
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className='bg-white border border-red-200 rounded-lg p-6'>
                            <h3 className='text-lg font-medium text-red-500 mb-2'>
                                <i className='fas fa-exclamation-triangle mr-2'></i>Danger Zone
                            </h3>
                            <p className='text-sm text-gray-500 mb-4'>Once you delete your account, there is no going back.</p>
                            {!showDeleteConfirm ? (
                                <button onClick={() => setShowDeleteConfirm(true)} className='bg-red-500 text-white px-6 py-2 text-sm hover:bg-red-600'>
                                    <i className='fas fa-trash mr-2'></i>Delete Account
                                </button>
                            ) : (
                                <div className='flex flex-col gap-3 max-w-sm'>
                                    {userInfo?.provider === 'manual' && (
                                        <input
                                            type='password'
                                            placeholder='Enter your password to confirm'
                                            value={deletePassword}
                                            onChange={(e) => setDeletePassword(e.target.value)}
                                            className='border px-3 py-2 text-sm'
                                        />
                                    )}
                                    <p className='text-sm text-red-500'>Are you sure? This action cannot be undone!</p>
                                    <div className='flex gap-2'>
                                        <button onClick={deleteAccount} className='bg-red-500 text-white px-4 py-2 text-sm hover:bg-red-600'>Yes, Delete</button>
                                        <button onClick={() => setShowDeleteConfirm(false)} className='bg-gray-200 text-gray-700 px-4 py-2 text-sm'>Cancel</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <div className='flex flex-col gap-4'>
                        {orders.length === 0 ? (
                            <p className='text-center text-gray-400 py-10'>No orders yet!</p>
                        ) : (
                            orders.map((order, index) => (
                                <div key={index} className='border rounded-lg p-4'>
                                    <div className='flex justify-between items-start mb-3'>
                                        <div>
                                            <p className='text-sm text-gray-500'>Date: {new Date(order.date).toLocaleDateString()}</p>
                                            <p className='text-sm text-gray-500'>Payment: {order.paymentMethod} — {order.payment ? '✅ Paid' : '⏳ Pending'}</p>
                                        </div>
                                        <div className='text-right'>
                                            <p className='font-medium'>{currency}{order.amount}</p>
                                            <p className={`text-sm font-medium ${getStatusColor(order.status)}`}>● {order.status}</p>
                                        </div>
                                    </div>
                                    <div className='flex flex-col gap-1'>
                                        {order.items.map((item, i) => (
                                            <p key={i} className='text-sm text-gray-600'>
                                                {item.name} x {item.quantity} ({item.size})
                                            </p>
                                        ))}
                                    </div>
                                    {order.status === 'Cancelled' && order.cancelReason && (
                                        <p className='text-xs text-red-400 mt-2'>Reason: {order.cancelReason}</p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                    <div className='bg-white border rounded-lg p-6 max-w-md'>
                        <h3 className='text-lg font-medium mb-4'>Change Password</h3>
                        {userInfo?.provider !== 'manual' ? (
                            <p className='text-gray-500 text-sm'>
                                <i className='fas fa-info-circle mr-1'></i>
                                You are logged in with {userInfo?.provider}. Password change is not available.
                            </p>
                        ) : (
                            <div className='flex flex-col gap-4'>
                                <div>
                                    <p className='text-sm text-gray-500 mb-1'>Current Password</p>
                                    <input type='password' value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className='border px-3 py-2 w-full' />
                                </div>
                                <div>
                                    <p className='text-sm text-gray-500 mb-1'>New Password</p>
                                    <input type='password' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className='border px-3 py-2 w-full' />
                                </div>
                                <div>
                                    <p className='text-sm text-gray-500 mb-1'>Confirm New Password</p>
                                    <input type='password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className='border px-3 py-2 w-full' />
                                </div>
                                <button onClick={changePassword} className='bg-black text-white px-6 py-2 text-sm w-fit'>
                                    Change Password
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Address Tab */}
                {activeTab === 'address' && (
                    <div className='flex flex-col gap-4'>
                        <div className='bg-white border rounded-lg p-6 max-w-lg'>
                            <h3 className='text-lg font-medium mb-4'>Address Book</h3>
                            <div className='flex flex-col gap-4'>
                                <div className='grid grid-cols-2 gap-3'>
                                    <div>
                                        <p className='text-sm text-gray-500 mb-1'>Street</p>
                                        <input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} className='border px-3 py-2 w-full' placeholder='Street' />
                                    </div>
                                    <div>
                                        <p className='text-sm text-gray-500 mb-1'>City</p>
                                        <input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className='border px-3 py-2 w-full' placeholder='City' />
                                    </div>
                                    <div>
                                        <p className='text-sm text-gray-500 mb-1'>State</p>
                                        <input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className='border px-3 py-2 w-full' placeholder='State' />
                                    </div>
                                    <div>
                                        <p className='text-sm text-gray-500 mb-1'>Zipcode</p>
                                        <input value={address.zipcode} onChange={(e) => setAddress({ ...address, zipcode: e.target.value })} className='border px-3 py-2 w-full' placeholder='Zipcode' />
                                    </div>
                                    <div>
                                        <p className='text-sm text-gray-500 mb-1'>Country</p>
                                        <input value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} className='border px-3 py-2 w-full' placeholder='Country' />
                                    </div>
                                    <div>
                                        <p className='text-sm text-gray-500 mb-1'>Phone</p>
                                        <input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} className='border px-3 py-2 w-full' placeholder='Phone' />
                                    </div>
                                </div>
                                <div className='flex gap-3'>
                                    <button onClick={updateProfile} className='bg-black text-white px-6 py-2 text-sm'>
                                        <i className='fas fa-save mr-2'></i>Save Address
                                    </button>
                                    {userInfo?.address?.street && (
                                        <button onClick={deleteAddress} className='bg-red-500 text-white px-6 py-2 text-sm hover:bg-red-600'>
                                            <i className='fas fa-trash mr-2'></i>Delete Address
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Profile
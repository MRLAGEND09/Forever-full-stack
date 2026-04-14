import React from 'react'

class FeatureErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Feature error boundary caught:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='mt-6 border rounded p-4 bg-amber-50 text-amber-800 text-sm'>
          This preview feature is temporarily unavailable on this browser/device.
        </div>
      )
    }

    return this.props.children
  }
}

export default FeatureErrorBoundary

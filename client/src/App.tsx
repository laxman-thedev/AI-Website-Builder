// App router that maps URLs to page components.
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Pricing from './pages/Pricing'
import Projects from './pages/Projects'
import MyProjects from './pages/MyProjects'
import Preview from './pages/Preview'
import Community from './pages/Community'
import View from './pages/View'
import Navbar from './components/Navbar'
import { Toaster } from "@/components/ui/sonner"
import AuthPage from './pages/auth/AuthPage'
import Settings from './pages/Settings'
import Loading from './pages/Loading'

const App = () => {

  // Track current path to toggle layout elements.
  const  {pathname} = useLocation()

  // Hide the navbar on immersive preview/editor routes.
  const hideNavbar = pathname.startsWith('/projects/') && pathname !== '/projects' || pathname.startsWith('/view/') || pathname.startsWith('/preview/')

  return (
    <div>
      <Toaster />
      {!hideNavbar && <Navbar />}
        {/* Main route table */}
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/pricing' element={<Pricing />} />
          <Route path='/projects/:projectId' element={<Projects />} />
          <Route path='/projects' element={<MyProjects />} />
          <Route path='/preview/:projectId' element={<Preview />} />
          <Route path='/preview/:projectId/:versionId' element={<Preview />} />
          <Route path='/community' element={<Community />} />
          <Route path='/view/:projectId' element={<View />} />

          <Route path="/auth/:pathname" element={<AuthPage />} />
          <Route path="/account/settings" element={<Settings />} />

          <Route path='/loading' element={<Loading />} />
        </Routes>
    </div>
  )
}

export default App

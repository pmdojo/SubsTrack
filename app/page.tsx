'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Header from './components/Header'
import HeroCard from './components/HeroCard'
import ActiveSubsCard from './components/ActiveSubsCard'
import SpendMiniCard from './components/SpendMiniCard'
import SpendingOverview from './components/SpendingOverview'
import SubList from './components/SubList'
import AddSubModal from './components/AddSubModal'
import {
  getSubs,
  addSub as addSubStore,
  deleteSub as deleteSubStore,
  updateSub as updateSubStore,
} from './lib/store'
import type { Subscription } from './lib/types'

const containerVariants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function Page() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editSub, setEditSub] = useState<Subscription | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setSubs(getSubs())
    setMounted(true)
  }, [])

  const handleAdd = (sub: Subscription) => {
    setSubs((prev) => [sub, ...prev])
    addSubStore(sub)
  }

  const handleDelete = (id: string) => {
    setSubs((prev) => prev.filter((s) => s.id !== id))
    deleteSubStore(id)
  }

  const handleEdit = (sub: Subscription) => {
    setEditSub(sub)
    setModalOpen(true)
  }

  const handleEditSave = (sub: Subscription) => {
    setSubs((prev) => prev.map((s) => (s.id === sub.id ? sub : s)))
    updateSubStore(sub)
    setEditSub(null)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditSub(null)
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F4F3F0',
      }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={mounted ? 'show' : 'hidden'}
        style={{
          maxWidth: 460,
          margin: '0 auto',
          padding: '20px 16px 100px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <motion.div variants={sectionVariants}>
          <Header subs={subs} />
        </motion.div>
        <motion.div variants={sectionVariants}>
          <HeroCard subs={subs} />
        </motion.div>
        <motion.div
          variants={sectionVariants}
          className="grid grid-cols-2"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
        >
          <ActiveSubsCard subs={subs} />
          <SpendMiniCard subs={subs} />
        </motion.div>
        <motion.div variants={sectionVariants}>
          <SpendingOverview subs={subs} />
        </motion.div>
        <motion.div variants={sectionVariants}>
          <SubList subs={subs} onDelete={handleDelete} onEdit={handleEdit} />
        </motion.div>
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setEditSub(null)
          setModalOpen(true)
        }}
        aria-label="Add subscription"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#7B6EF6',
          color: '#fff',
          border: 'none',
          fontSize: 28,
          fontWeight: 300,
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(123,110,246,0.4)',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          paddingBottom: 3,
        }}
      >
        +
      </motion.button>

      <AddSubModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onAdd={handleAdd}
        onEdit={handleEditSave}
        editSub={editSub}
      />
    </main>
  )
}

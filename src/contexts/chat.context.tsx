import { type ReactNode, createContext, useContext, useState, useCallback } from 'react'

interface ChatContextType {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  activeTab: 'ai' | 'seller'
  setActiveTab: (tab: 'ai' | 'seller') => void
  selectedStoreId: string | null
  selectedStoreName: string | null
  setSelectedStoreId: (storeId: string | null) => void
  openChatWithStore: (storeId: string, storeName?: string) => void
}

const ChatContext = createContext<ChatContextType>({
  isOpen: false,
  setIsOpen: () => { },
  activeTab: 'ai',
  setActiveTab: () => { },
  selectedStoreId: null,
  selectedStoreName: null,
  setSelectedStoreId: () => { },
  openChatWithStore: () => { }
})

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'ai' | 'seller'>('ai')
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [selectedStoreName, setSelectedStoreName] = useState<string | null>(null)

  const openChatWithStore = useCallback((storeId: string, storeName?: string) => {
    setSelectedStoreId(storeId)
    setSelectedStoreName(storeName || null)
    setActiveTab('seller')
    setIsOpen(true)
  }, [])

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        setIsOpen,
        activeTab,
        setActiveTab,
        selectedStoreId,
        selectedStoreName,
        setSelectedStoreId,
        openChatWithStore
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => useContext(ChatContext)


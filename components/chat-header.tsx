'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { useState } from 'react';

import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon, VercelIcon } from './icons';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { VisibilityType, VisibilitySelector } from './visibility-selector';
import { DownloadIcon } from './icons';
import { SearchIcon } from './icons';

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const [showSearch, setShowSearch] = useState(false);
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 768;

  const handleExportChat = () => {
    // Implement export functionality here
    console.log('Exporting chat', chatId);
    
    // Example implementation:
    // 1. Fetch chat data (if not already available)
    // 2. Format it for export (JSON, text, etc.)
    // 3. Create and download a file
    
    // Basic download example:
    const dummyData = `Chat ID: ${chatId}\nModel: ${selectedModelId}\nExported at: ${new Date().toISOString()}`;
    const blob = new Blob([dummyData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${chatId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    
    console.log('Searching for:', query);
    // Implement your search logic here, for example:
    // 1. Search through chat messages
    // 2. Highlight matching messages
    // 3. Scroll to the first match
  };

  return (
    <header className="flex sticky top-0 z-20 bg-background py-1.5 items-center px-2 md:px-4 gap-2 border-b">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-3 px-2 md:h-9 h-8 ml-auto md:ml-0 touch-manipulation"
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="sr-only md:not-sr-only md:ml-2">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
      )}

      {!isReadonly && (
        <ModelSelector
          selectedModelId={selectedModelId}
          className="order-1 md:order-2 max-w-[140px] md:max-w-[200px]"
        />
      )}

      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
          className="order-1 md:order-3 hidden xs:block"
        />
      )}

      <div className="flex-1 md:flex-none"></div>

      {chatId !== 'new' && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size={isMobile ? "sm" : "icon"} 
                className="order-5 md:order-7 h-8 w-8 md:h-9 md:w-9 touch-manipulation"
                onClick={() => setShowSearch(!showSearch)}
              >
                <SearchIcon className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search in Chat</TooltipContent>
          </Tooltip>
          
          {showSearch && (
            <div className="absolute top-full left-0 w-full bg-background border-b border-border p-2 flex items-center gap-2 animate-in slide-in-from-top duration-200 z-30">
              <SearchIcon className="h-4 w-4 text-muted-foreground ml-2" />
              <input
                type="text"
                placeholder="Search in chat history..."
                className="flex-1 bg-transparent border-none outline-none text-sm focus:ring-0"
                autoFocus
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowSearch(false);
                  }
                }}
              />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowSearch(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </>
      )}

      {chatId !== 'new' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size={isMobile ? "sm" : "icon"}
              className="order-6 md:order-8 h-8 w-8 md:h-9 md:w-9 touch-manipulation"
              onClick={handleExportChat}
            >
              <DownloadIcon className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export Chat</TooltipContent>
        </Tooltip>
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId;
});

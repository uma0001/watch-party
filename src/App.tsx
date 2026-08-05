import React, { useRef, useState } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { Lobby } from './components/Lobby';
import { Navbar } from './components/Navbar';
import { ParticipantList } from './components/ParticipantList';
import { PlaybackControls } from './components/PlaybackControls';
import { ShareModal } from './components/ShareModal';
import { ToastContainer } from './components/ToastContainer';
import { VideoPlayer, VideoPlayerRef } from './components/VideoPlayer';
import { useRoom } from './hooks/useRoom';

export default function App() {
  const {
    socketStatus,
    socketId,
    roomState,
    playbackState,
    myParticipant,
    canControlPlayback,
    isHost,
    chatMessages,
    liveReactions,
    toasts,
    kickedReason,
    joinRoom,
    leaveRoom,
    play,
    pause,
    seek,
    changeVideo,
    assignRole,
    removeParticipant,
    transferHost,
    sendChatMessage,
    sendLiveReaction,
    requestSync,
    removeToast,
  } = useRoom();

  const [activeTab, setActiveTab] = useState<'chat' | 'members'>('chat');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const videoPlayerRef = useRef<VideoPlayerRef>(null);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Share Modal */}
      {roomState && (
        <ShareModal
          isOpen={isShareOpen}
          roomId={roomState.roomId}
          onClose={() => setIsShareOpen(false)}
        />
      )}

      {/* Global Navbar */}
      <Navbar
        roomId={roomState?.roomId || null}
        participantCount={roomState?.participants.length || 0}
        socketStatus={socketStatus}
        onLeaveRoom={leaveRoom}
        onOpenShare={() => setIsShareOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col">
        {kickedReason && !roomState && (
          <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-center text-xs font-semibold">
            {kickedReason}
          </div>
        )}

        {!roomState ? (
          <Lobby onJoinRoom={joinRoom} />
        ) : (
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Video Stage & Controls */}
            <div className="lg:col-span-8 space-y-4">
              <VideoPlayer
                ref={videoPlayerRef}
                playbackState={playbackState}
                canControlPlayback={canControlPlayback}
                onPlay={play}
                onPause={pause}
                onSeek={seek}
                onRequestSync={requestSync}
                onDurationChange={setVideoDuration}
                reactions={liveReactions}
              />

              <PlaybackControls
                playbackState={playbackState}
                canControlPlayback={canControlPlayback}
                onPlay={play}
                onPause={pause}
                onSeek={seek}
                onChangeVideo={changeVideo}
                onRequestSync={requestSync}
                duration={videoDuration}
                onToggleFullscreen={() => videoPlayerRef.current?.toggleFullscreen()}
              />
            </div>

            {/* Right Column: Sidebar with Tab Switcher for Members & Chat */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Mobile / Tablet Tab Toggle */}
              <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'chat'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Party Chat ({chatMessages.length})
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'members'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Members ({roomState.participants.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1">
                {activeTab === 'chat' ? (
                  <ChatPanel
                    messages={chatMessages}
                    currentUserId={socketId}
                    onSendMessage={sendChatMessage}
                    onSendReaction={sendLiveReaction}
                  />
                ) : (
                  <ParticipantList
                    participants={roomState.participants}
                    currentUserId={socketId}
                    isHost={isHost}
                    onAssignRole={assignRole}
                    onRemoveParticipant={removeParticipant}
                    onTransferHost={transferHost}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

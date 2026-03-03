import { getMeetingsAction } from '@/actions/getMeetings';
import MeetingsList from './MeetingsList';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Reuniões | Central Viva a Vida',
    description: 'Agendamento e acesso às salas do Google Meet',
};

export default async function MeetingsPage() {
    const meetings = await getMeetingsAction();

    return <MeetingsList initialMeetings={meetings} />;
}

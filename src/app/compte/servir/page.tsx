import { redirect } from 'next/navigation';
import { getAuthenticatedCotisant, getLinkedServer } from '../session';
import ServirClient from './ServirClient';

export default async function CompteServirPage() {
  const cotisant = await getAuthenticatedCotisant();

  if (!cotisant) {
    redirect('/compte/connexion');
  }

  const server = await getLinkedServer(cotisant.email);

  if (!server) {
    // Ce cotisant n'a pas été relié à une fiche serveur depuis /admin/servers.
    redirect('/compte');
  }

  return <ServirClient serverId={server.id} serverName={`${server.first_name} ${server.last_name}`} />;
}

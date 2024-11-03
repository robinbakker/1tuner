import { Bookmark, Facebook, Instagram, Play, Twitter, Youtube } from 'lucide-preact';
import { useRoute } from 'preact-iso';
import { useEffect, useState } from 'preact/hooks';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { setPlayerState } from '~/store/signals/player';
import {
  addRecentlyVisitedRadioStation,
  followRadioStation,
  getRadioStation,
  isFollowedRadioStation,
  radioGenres,
  radioStations,
  unfollowRadioStation,
} from '~/store/signals/radio';
import { SocialAccountType } from '../store/types';

export const RadioStationPage = () => {
  const { params } = useRoute();
  const radioStation = getRadioStation(params.id);
  const [isFollowing, setIsFollowing] = useState(isFollowedRadioStation(params.id));

  const getSocialIcon = (type: SocialAccountType) => {
    switch (type) {
      case SocialAccountType.Facebook:
        return <Facebook size={20} />;
      case SocialAccountType.Instagram:
        return <Instagram size={20} />;
      case SocialAccountType.Twitter:
        return <Twitter size={20} />;
      case SocialAccountType.Youtube:
        return <Youtube size={20} />;
      default:
        return null;
    }
  };

  const toggleFollow = () => {
    if (!radioStation) return;

    if (isFollowing) {
      unfollowRadioStation(radioStation.id);
    } else {
      followRadioStation(radioStation.id);
    }
    setIsFollowing(!isFollowing);
  };

  useEffect(() => {
    setIsFollowing(isFollowedRadioStation(params.id));
  }, [setIsFollowing, isFollowedRadioStation, params.id]);

  if (!radioStation) {
    return <div>Radio station not found</div>;
  }

  useEffect(() => {
    addRecentlyVisitedRadioStation(radioStation?.id);
  }, [radioStation, addRecentlyVisitedRadioStation]);

  return (
    <div class="min-h-screen">
      <header class="relative overflow-hidden -ml-4 -mr-4 px-4 bg-primary/20 py-16 -skew-y-3 transform -mt-16 mb-8">
        <div class="absolute inset-0 z-0">
          <img src={radioStation.logosource} class="w-full filter blur-md opacity-50" />
        </div>
        <div class="container mx-auto px-4 pt-6 skew-y-3 transform relative z-10">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div class="flex items-center space-x-4">
              <img src={radioStation.logosource} alt="Radio station logo" width={80} height={80} class="rounded-full" />
              <div>
                <h1 class="text-3xl font-bold text-white drop-shadow">{radioStation.name}</h1>
                {!!radioStation.social?.length && (
                  <div class="flex opacity-60 space-x-2 my-2">
                    {radioStation.social?.map((s) => {
                      return (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-white drop-shadow hover:text-black"
                        >
                          {getSocialIcon(s.type)}
                        </a>
                      );
                    })}
                  </div>
                )}
                {!!radioStation.website && (
                  <p>
                    <a
                      href={radioStation.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-white hover:text-black drop-shadow"
                    >
                      {radioStation.website}
                    </a>
                  </p>
                )}
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <Button onClick={toggleFollow} variant={isFollowing ? 'ghost' : 'secondary'}>
                <Bookmark class={`mr-2 h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button
                onClick={() => {
                  setPlayerState({
                    isPlaying: true,
                    contentID: radioStation.id,
                    title: radioStation.name,
                    description: '',
                    imageUrl: radioStation.logosource,
                    streams: radioStation.streams,
                    pageLocation: `/radio-station/${radioStation.id}`,
                  });
                }}
                class="rounded-full px-4"
              >
                <Play class="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main class="container mx-auto px-4 py-8">
        {/* <section class="mb-12">
          <h2 class="text-2xl font-semibold mb-4">Related Podcasts</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((podcast) => (
              <Card key={podcast}>
                <CardContent class="p-4">
                  <div class="flex items-center space-x-4">
                    <img
                      src={`/placeholder.svg?height=80&width=80&text=Podcast ${podcast}`}
                      alt={`Podcast ${podcast}`}
                      width={80}
                      height={80}
                      class="rounded-md"
                    />
                    <div>
                      <h3 class="font-semibold line-clamp-2">Amazing Podcast Title That Might Be Long</h3>
                      <p class="text-sm text-muted-foreground line-clamp-2 mt-1">
                        This is a brief description of the podcast. It might contain interesting details about the
                        content.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section> */}

        {!!radioStation.related?.length && (
          <section>
            <h2 class="text-2xl font-semibold mb-4">Related</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {radioStations.value
                .filter((rs) => radioStation.related?.includes(rs.id))
                .map((s) => (
                  <a
                    key={`related-${s.id}`}
                    class="flex flex-col items-center p-2 h-auto"
                    href={`/radio-station/${s.id}`}
                  >
                    <Card class="w-[100px]">
                      <CardContent class="p-2">
                        <img src={s.logosource} alt={`${s.name} logo`} class="w-20 h-20 object-contain mb-2" />
                        <h3 class="text-center text-sm truncate w-full" title={s.name}>
                          {s.name}
                        </h3>
                        <p class="text-sm text-muted-foreground mt-1">
                          {radioGenres.value
                            .filter((rg) => s.genres.includes(rg.id))
                            .map((rg) => rg.name)
                            .join(', ')}
                        </p>
                      </CardContent>
                    </Card>
                  </a>
                ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

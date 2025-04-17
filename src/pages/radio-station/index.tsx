import { Bookmark, Facebook, Globe, Instagram, Pause, Play, Twitter, Youtube } from 'lucide-preact';
import { useLocation } from 'preact-iso';
import { Loader } from '~/components/loader';
import { PodcastCard } from '~/components/podcast-card';
import { RadioStationCard } from '~/components/radio-station-card';
import { Button } from '~/components/ui/button';
import { normalizedUrlWithoutScheme } from '~/lib/utils';
import { playerState } from '~/store/signals/player';
import { radioStations } from '~/store/signals/radio';
import { SocialAccountType } from '~/store/types';
import { useRadioStation } from './useRadioStation';

export const RadioStationPage = () => {
  const { route } = useLocation();
  const { params, radioStation, isPlaying, isFetchingData, isFollowing, stationPodcasts, toggleFollow } =
    useRadioStation();

  if (isFetchingData) {
    return <Loader />;
  }

  if (typeof window !== 'undefined' && !radioStation) {
    if (params.id) {
      route('/404-page-not-found', true);
      return <></>;
    }
    route('/radio-stations', true);
    return <></>;
  }

  if (!radioStation) {
    return <div>Radio station not found</div>;
  }

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

  return (
    <div class="min-h-screen">
      <header class="relative w-full overflow-hidden pt-24 pb-8 bg-black/75 -skew-y-3 transform -mt-32 mb-8">
        <div class="absolute -inset-2 -top-40 md:-top-96 z-0">
          <img src={radioStation.logosource} class="w-full filter blur-2xl opacity-50" />
        </div>
        <div class="px-6 pt-6 skew-y-3 transform relative z-10">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div class="flex items-center space-x-4">
              <img
                src={radioStation.logosource}
                alt="Radio station logo"
                width="80"
                height="80"
                class="w-24 h-24 sm:w-28 sm:h-28 sm:mr-4 md:mr-6 rounded-full"
              />
              <div>
                <h1 class="text-3xl font-bold sm:mb-3 text-white drop-shadow-lg">{radioStation.name}</h1>
                {!!radioStation.social?.length && (
                  <div class="flex opacity-60 space-x-2 my-2">
                    {radioStation.social?.map((s) => {
                      return (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-white/90 drop-shadow-sm hover:text-white w-6"
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
                      class="text-white/90 inline-flex items-center mt-1 group hover:text-white drop-shadow-sm transition-colors"
                    >
                      <Globe class={'mr-2 text-white/50 group-hover:text-white/70'} size={16} />
                      {normalizedUrlWithoutScheme(radioStation.website)}
                    </a>
                  </p>
                )}
              </div>
            </div>
            <div class="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-normal">
              <Button onClick={toggleFollow} variant={isFollowing ? 'ghost' : 'secondary'}>
                <Bookmark class={`mr-2 h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button
                onClick={() => {
                  playerState.value = {
                    playType: 'radio',
                    isPlaying: !isPlaying,
                    contentID: radioStation.id,
                    title: radioStation.name,
                    description: '',
                    imageUrl: radioStation.logosource,
                    streams: radioStation.streams,
                    pageLocation: `/radio-station/${radioStation.id}`,
                  };
                }}
                styleSize="icon"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause class="h-5 w-5" /> : <Play class="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div class="container mx-auto px-8 py-6">
        <>
          {!!radioStation.related?.length && (
            <section class="@container">
              <h2 class="text-2xl font-semibold mb-4">Related</h2>
              <div class="grid grid-cols-1 @md:grid-cols-2 @4xl:grid-cols-3 gap-6">
                {radioStations.value
                  .filter((rs) => radioStation.related?.includes(rs.id))
                  .map((s) => (
                    <RadioStationCard key={`related-${s.id}`} station={s} size="large" />
                  ))}
              </div>
            </section>
          )}
        </>
        <>
          {!!stationPodcasts.length && (
            <section class="@container">
              <h2 class="text-2xl font-semibold mt-12 mb-4">Related podcasts</h2>
              <div class="grid grid-cols-1 @md:grid-cols-2 @4xl:grid-cols-3 gap-6">
                {stationPodcasts.map((p) => (
                  <PodcastCard key={`p${p.id}`} podcast={p} size={'large'} />
                ))}
              </div>
            </section>
          )}
        </>
      </div>
    </div>
  );
};

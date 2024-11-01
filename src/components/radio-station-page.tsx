import { Bookmark, Facebook, Instagram, Play, Twitter, Youtube } from 'lucide-preact';
import { useRoute } from 'preact-iso';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Toggle } from '~/components/ui/toggle';
import { getRadioStation } from '~/lib/store';
import { SocialAccountType } from './types';

export function RadioStationPage() {
  const { params } = useRoute();
  const radioStation = getRadioStation(params.id);
  //const [isFollowing, setIsFollowing] = useState(false);

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

  if (!radioStation) {
    return <div>Radio station not found</div>;
  }

  return (
    <div class="min-h-screen">
      <header class="relative overflow-hidden bottom-16 bg-primary/10 py-16 -skew-y-3 transform -mt-16 mb-8">
        <div class="absolute inset-0 z-0">
          <img src={radioStation.logosource} class="w-full filter blur-md opacity-50" />
        </div>
        <div class="container mx-auto px-4 skew-y-3 transform relative z-10">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div class="flex items-center space-x-4">
              <img src={radioStation.logosource} alt="Radio station logo" width={80} height={80} class="rounded-full" />
              <div>
                <h1 class="text-3xl font-bold text-primary">{radioStation.name}</h1>
                <div class="flex space-x-2 mt-2">
                  {radioStation.social?.map((s) => {
                    return (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-muted-foreground hover:text-primary"
                      >
                        {getSocialIcon(s.type)}
                      </a>
                    );
                  })}
                </div>
                {!!radioStation.website && (
                  <p>
                    <a
                      href={radioStation.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-muted-foreground hover:text-primary"
                    >
                      {radioStation.website}
                    </a>
                  </p>
                )}
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <Toggle aria-label="Follow station">
                <Bookmark class="h-4 w-4 mr-2" />
                Follow
              </Toggle>
              <Button styleSize="lg" class="rounded-full">
                <Play class="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main class="container mx-auto px-4 py-8">
        <section class="mb-12">
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
        </section>

        <section>
          <h2 class="text-2xl font-semibold mb-4">Related Radio Stations</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((station) => (
              <Card key={station}>
                <CardContent class="p-4 flex flex-col items-center text-center">
                  <img
                    src={`/placeholder.svg?height=100&width=100&text=Station ${station}`}
                    alt={`Station ${station}`}
                    width={100}
                    height={100}
                    class="rounded-full mb-2"
                  />
                  <h3 class="font-semibold">Radio Station {station}</h3>
                  <p class="text-sm text-muted-foreground mt-1">Genre</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

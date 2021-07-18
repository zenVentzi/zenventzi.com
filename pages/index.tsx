import { Box, Flex, Divider, VStack, Center, HStack } from '@chakra-ui/react';
import { GetStaticProps } from 'next';
import { NextSeo } from 'next-seo';
import * as contentful from 'contentful';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';
import React from 'react';
import BlogPostPreview from '../modules/index/BlogPostPreview';
import { SerializedPost, UnserializedPost } from '../modules/common/types';
import { IndexMeta } from '../modules/index/types';

const contentfulClient = contentful.createClient({
  // FIXME
  space: process.env.CONTENTFUL_SPACE_ID as string,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN as string,
});

type IndexProps = {
  posts: SerializedPost[];
  meta: IndexMeta;
};

const Index = ({ posts, meta }: IndexProps) => {
  return (
    <div>
      <NextSeo title={meta.title} description={meta.description} />
      <Center>
        <VStack
          spacing="20px"
          pt="30px"
          // maxWidth={{ base: '50%' }}
          // width="50%"
          maxWidth={{ base: '95%', md: '85%', lg: '80%' }}
          // style={{ background: 'green' }}
          // justify="center"
          align="flex-start"
          divider={
            <HStack w="100%" justify="center" visibility="hidden">
              <Divider
                width={{ base: '80%', sm: '70%', md: '50%' /* lg: '40%' */ }}
                visibility="visible"
              />
            </HStack>
          }
        >
          {posts.map((post) => {
            return <BlogPostPreview key={post.slug} post={post} />;
          })}
          {/* <div>teeeeeest</div>
        <div style={{ background: 'red' }}>teeeeeest</div> */}
        </VStack>
      </Center>
    </div>
  );
};

export default Index;

export const getStaticProps: GetStaticProps<IndexProps> = async (context) => {
  // console.log(context.params);

  const entry = await contentfulClient.getEntries<UnserializedPost>({
    content_type: 'blogPost',
  });

  // console.log('entry');
  // console.dir(entry, { depth: null });

  const unserializedPosts: UnserializedPost[] | null | undefined =
    entry.items.map((item) => {
      const { content, data } = matter(item.fields.content);
      const contentPreview = content.substring(0, 200);

      // TODO: check data fields if empty

      return {
        title: data.title,
        lastUpdate: data.lastUpdate,
        tags: data.tags,
        content,
        contentPreview,
        slug: data.slug,
        meta: data.meta,
      };
    });

  const serializedPosts: SerializedPost[] = await Promise.all(
    unserializedPosts.map(async (unPost) => {
      const serializedContent = await serialize(unPost.content);
      const serializedContentPreview = await serialize(unPost.contentPreview);
      const serializedPost: SerializedPost = {
        ...unPost,
        content: serializedContent,
        contentPreview: serializedContentPreview,
      };

      return serializedPost;
    })
  );

  const metaEntry = await contentfulClient.getEntries<IndexMeta>({
    content_type: 'homePageMeta',
  });
  const homeMeta: IndexMeta = metaEntry.items.map((item) => {
    return { title: item.fields.title, description: item.fields.description };
  })[0];

  return {
    props: { posts: serializedPosts, meta: homeMeta },
    revalidate: 1,
  };
};

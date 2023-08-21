"use client";

// import Image from "next/image";
// import Chat from "@/components/_archive/chat";
import CodeChat from "@/components/codeChat";
// import ChatReverseScroll from "@/components/chat-reverse-scroll";

import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import { useUser } from "@/lib/UserContext";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function Home() {
  const router = useRouter();

  const userContext = useUser();

  const handleSupabaseAuth = async () => {
    if (userContext?.user) {
      await userContext.signOut();
      router.push("/signin");
    } else {
      router.push("/signin");
    }
  };

  return (
    <section className="px-4 sm:px-8 flex flex-col items-center justify-center gap-6 pt-12 pb-8 w-full max-w-[800px] ">
      <div className="flex gap-2 justify-between w-full px-2">
        <h1 className="flex flex-col items-center h-full text-4xl font-bold">
          Share Code
        </h1>
        <div className="w-auto items-center flex">
          <button
            className="rounded bg-gray-200 px-2  hover:bg-gray-100 cursor-pointer border"
            onClick={handleSupabaseAuth}
          >
            {userContext?.user ? "Sign Out" : "Sign In"}
          </button>
        </div>
      </div>

      <div className="w-full">
        <CodeChat supabase={supabase} />
      </div>
      {/* <div>
        <Test />
      </div> */}
    </section>
  );
}

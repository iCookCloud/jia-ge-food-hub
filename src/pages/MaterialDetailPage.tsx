import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Link } from "react-router-dom";

// Helper: format seconds to mm:ss
const formatDuration = (seconds?: number | null) => {
  if (!seconds || seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

type AssocRow = {
  product_id: string;
  products: {
    standard_chinese_name: string;
    standard_english_name: string;
    unit_price: string | null;
  };
};

const MaterialDetailPage = () => {
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // Include supplier_id and use duration_seconds from DB
      const { data, error } = await supabase
        .from("product_videos")
        .select(`
          id,
          title,
          description,
          video_url,
          thumbnail_url,
          cloudflare_video_id,
          is_active,
          status,
          created_at,
          updated_at,
          duration_seconds,
          supplier_id,
          video_product_associations (
            product_id,
            products (
              standard_chinese_name,
              standard_english_name,
              unit_price
            )
          )
        `)
        .eq("id", id)
        .single();

      if (!mounted) return;
      if (error) {
        console.error(error);
      } else {
        setVideo(data);
      }
      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!video) {
    return <div>Video not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-bold">
          {video.title}
        </h1>
        {/* Remove reliance on non-existent fields like category/views/likes */}
        <div className="text-sm text-muted-foreground">
          时长 {formatDuration(video?.duration_seconds ?? 0)}
        </div>
      </div>

      {/* Publisher note: 发布者即厂家 */}
      <div className="mt-2 text-xs text-muted-foreground">
        每个商品的发布者即为该商品的厂家；厂家确认后才可下单。
      </div>

      {/* Media */}
      <AspectRatio ratio={16 / 9} className="w-full mt-4">
        {video.cloudflare_video_id ? (
          <iframe
            src={`https://iframe.cloudflarestream.com/${video.cloudflare_video_id}`}
            style={{ border: "none" }}
            allowFullScreen
            title="Cloudflare Stream video"
          />
        ) : (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="object-cover rounded-md"
          />
        )}
      </AspectRatio>

      {/* Associated products */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">关联商品</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(video?.video_product_associations as AssocRow[] | undefined)?.map((association: AssocRow) => (
            <div key={association.product_id} className="border rounded-lg p-3">
              <div className="font-medium">{association.products?.standard_chinese_name}</div>
              <div className="text-xs text-muted-foreground">
                {association.products?.standard_english_name}
              </div>
              <div className="text-sm mt-1">
                价格：{association.products?.unit_price ?? "-"}
              </div>
            </div>
          )) || null}
        </div>
      </div>

      {/* Supplier section: only show a simple note; supplier_id is available if needed */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">厂家信息</h2>
        <p className="text-sm text-muted-foreground">
          厂家ID: {video.supplier_id}
        </p>
      </div>
    </div>
  );
};

export default MaterialDetailPage;

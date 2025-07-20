import { Layout } from "@/components/layout/Layout";
import { MessageCenter } from "@/components/messages/MessageCenter";

const MessagesPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">消息中心</h1>
          <p className="text-muted-foreground">管理您的所有消息和对话</p>
        </div>
        
        <MessageCenter />
      </div>
    </Layout>
  );
};

export default MessagesPage;
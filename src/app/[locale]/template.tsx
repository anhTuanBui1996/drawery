"use client";

import { Box } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import GlobalLoading from "@/src/components/custom/loader/GlobalLoading";

export default function Template({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { mode } = useColorScheme();
  const [mounted, setMounted] = useState(false);

  // Chỉ kích hoạt giao diện Client sau khi đã Hydrate xong
  useEffect(() => {
    setMounted(true);
  }, []);

  // Trong lúc chờ Hydrate ở Client, hiển thị một khung trống hoặc chính màn hình Loading của bạn
  if (!mounted) {
    return <GlobalLoading open={true} />;
  }

  return (
    <Box
      sx={{
        // Bảo vệ ứng dụng nếu mode chưa kịp nhận diện
        bgcolor: mode === "dark" ? "#313131" : "#f9fafb",
        minHeight: "calc(100vh - 64px)",
        // Thêm transition nhẹ để khi đổi theme mượt mà hơn, không bị giật màu
        transition: "background-color 0.3s ease", 
      }}
    >
      {children}
    </Box>
  );
}

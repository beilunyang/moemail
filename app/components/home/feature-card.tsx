interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-4 rounded-xl border border-primary/20 bg-background/50 backdrop-blur-sm hover:border-primary/50 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 text-primary p-2">
          {icon}
        </div>
        <div className="text-left">
          <h3 className="font-bold">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  )
} 
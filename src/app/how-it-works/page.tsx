
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, KeyRound, ListOrdered, DatabaseZap, BrainCog, Settings2 } from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      icon: <KeyRound className="h-8 w-8 text-primary mb-2" />,
      title: "1. Define Your Fields",
      description: "Input custom fields like 'Site Name', 'Username', 'Favorite Pet', or any secret phrase. You can add up to 10 fields. These fields act as your personal ingredients for password generation."
    },
    {
      icon: <ListOrdered className="h-8 w-8 text-primary mb-2" />,
      title: "2. Order Matters",
      description: "Arrange your fields by dragging and dropping them. The sequence of your fields is crucial. Changing the order will result in a different password, adding an extra layer of uniqueness."
    },
    {
      icon: <Settings2 className="h-8 w-8 text-primary mb-2" />, 
      title: "3. Toggle Inclusion & Combination",
      description: "For each field, decide if its value should be included in the password generation. The tool then combines parts of your included field values. The system attempts to create a password that meets length (8-16 characters) and basic complexity requirements (e.g., by trying to include an uppercase letter, a number, and a special character if they are not naturally present from your inputs)."
    },
    {
      icon: <DatabaseZap className="h-8 w-8 text-primary mb-2" />,
      title: "4. Nothing is Stored",
      description: "FieldKey is designed with privacy at its core. Your field values and generated passwords are NEVER stored on any server or your local device. The password is regenerated on-the-fly each time based on your exact inputs and sequence."
    },
    {
      icon: <BrainCog className="h-8 w-8 text-primary mb-2" />, 
      title: "5. Remember Your Inputs",
      description: "Since nothing is stored, you MUST remember the exact field values and their order to regenerate the same password. Think of your field combination as your master key. You can use the 'Presets' feature to save the field structure (labels and order, not values) for convenience."
    }
  ];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">How FieldKey Works</CardTitle>
          <CardDescription>
            Understand the simple yet powerful process behind FieldKey's deterministic password generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left space-y-3 sm:space-y-0 sm:space-x-4 p-4 border rounded-lg bg-card/30">
              <div className="flex-shrink-0">{step.icon}</div>
              <div>
                <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
          <div className="pt-4">
            <h3 className="text-2xl font-semibold mb-2">Key Takeaways:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Deterministic:</strong> Same inputs + same order = same password, every time.</li>
              <li><strong>Locally Generated:</strong> Passwords are created in your browser based on your inputs.</li>
              <li><strong>Private:</strong> No data (field values or passwords) is ever stored.</li>
              <li><strong>You're in Control:</strong> Your memory of the inputs is the key. Use presets for field structures.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

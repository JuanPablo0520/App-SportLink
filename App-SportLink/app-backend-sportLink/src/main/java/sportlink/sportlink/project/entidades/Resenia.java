package sportlink.sportlink.project.entidades;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "RESENIAS")
@ToString
@Builder
@Entity
public class Resenia implements Serializable {

    @Id
    @Column(name = "RES_ID", nullable = false)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SEQ_RESENIAS")
    @SequenceGenerator(name = "SEQ_RESENIAS", sequenceName = "SEQ_RESENIAS", allocationSize = 1)
    private Integer idResenia;

    @Column(name = "RES_CALIFICACION", nullable = false)
    private Integer calificacion;

    @Column(name = "RES_COMENTARIO", nullable = false)
    private String comentario;

    @ManyToOne
    @JoinColumn(name = "CLI_ID")
    @JsonIgnoreProperties({"resenias", "sesiones", "chats"})
    private Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "ENT_ID")
    @JsonIgnoreProperties({"resenias", "sesiones","servicios", "chats"})
    private Entrenador entrenador;
}

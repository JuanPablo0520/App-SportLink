package sportlink.sportlink.project.entidades;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "SESIONES")
@ToString
@Builder
@Entity
public class Sesion implements Serializable {

    @Id
    @Column(name = "SES_ID", nullable = false)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SEQ_SESION")
    @SequenceGenerator(name = "SEQ_SESION", sequenceName = "SEQ_SESION", allocationSize = 1)
    private Integer idSesion;

    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm")
    @Column(name = "SES_FECHAHORA", nullable = false)
    private LocalDateTime fechaHora;

    @Column(name = "SES_ESTADO", nullable = false)
    private String estado;

    @ManyToOne
    @JoinColumn(name = "CLI_ID")
    @JsonIgnoreProperties({"sesiones", "chats", "resenias"})
    private Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "ENT_ID")
    @JsonIgnoreProperties({"sesiones","servicios", "resenias", "chats"})
    private Entrenador entrenador;

}

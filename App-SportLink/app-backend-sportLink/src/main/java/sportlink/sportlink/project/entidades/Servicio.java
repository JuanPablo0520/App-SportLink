package sportlink.sportlink.project.entidades;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "SERVICIOS")
@ToString
@Builder
@Entity
public class Servicio implements Serializable {

    @Id
    @Column(name = "SER_ID", nullable = false)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SEQ_SERVICIO")
    @SequenceGenerator(name = "SEQ_SERVICIO", sequenceName = "SEQ_SERVICIO", allocationSize = 1)
    private Integer idServicio;

    @Column(name = "SER_NOMBRE", nullable = false)
    private String nombre;

    @Column(name = "SER_DESCRIPCION", nullable = false)
    private String descripcion;

    @Column(name = "SER_PRECIO", nullable = false)
    private Float precio;

    @Column(name = "SER_UBICACION", nullable = false)
    private String ubicacion;

    @ManyToOne
    @JoinColumn(name = "ENT_ID")
    @JsonIgnoreProperties({"servicios","sesiones", "resenias", "chats"})
    private Entrenador entrenador;

}

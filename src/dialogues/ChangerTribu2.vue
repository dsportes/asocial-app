<template>
  <q-card class="petitelargeur q-pa-xs">
    <q-card-section>
      <div class="titre-lg full-width text-center q-mb-lg">Transférer un compte vers la tribu {{tribu.na.nom}}
        ou changer son statut de parrain s'il y est déjà
      </div>

      <div v-if="cref.diag" class="titre-md q-ma-sm bg-yellow-5 q-px-xs text-bold text-negative">{{cref.diag}}</div>

      <div v-if="!cref.na" class="titre-md">Aucun avatar copiée.</div>
      <div v-else class="titre-md">Dernier avatar copié :
        <fiche-avatar :na-avatar="cref.na" />
        <div v-if="cref.ok" class="fs-md q-my-xs">
          Tribu actuelle : {{cref.nata.nom}}
          <span v-if="cref.stpa" class="text-bold q-ml-md text-warning"> est PARRAIN</span>
        </div>
        <div v-if="phase===0">
          <q-separator/>
          <div v-if="cref.ok && diag === ''">
            <div class="titre-md q-my-sm">Si c'est le compte souhaité :
              <q-btn class="q-mr-sm" dense color="primary" size="md" no-caps label="cliquer ici" @click="okcompte"/>
            </div>
            <div class="titre-md">Sinon :</div>
          </div>
          <div v-if="cref.ok && diag !== ''" class="titre-md q-my-sm q-px-xs text-negative bg-yellow-5 text-bold">Ce compte ne peut pas être transféré</div>
        </div>
      </div>
      <q-separator/>

      <div v-if="phase===0">
        <div class="titre-md q-ml-md">(1) Ouvrir le répertoire des contacts en appuyant sur ce bouton
          <q-btn class="q-ma-xs" dense color="primary" size="sm" label="Contacts" icon="visibility"
            @click="panelcontacts=true"/>
        </div>
        <div class="titre-md q-ml-md">(2) Rechercher l'avatar souhaité et cliquer sur le bouton
          <q-icon class="qpx-sm" name="content_copy" color="primary" size="sm"/> situé à côté du nom
        </div>
        <div class="titre-md q-ml-md">(3) Fermer le panneau des contacts (chevron en haut à droite)
        </div>
        <q-separator/>
      </div>

      <div v-if="phase===1">
        <div v-if="!cref.chgt" class="titre-md text bold text-warning bg-yellow-5 q-pa-xs q-ma-sm">
          Le compte ne change pas de tribu. Son statut de parrain peut cependant être changé.
        </div>
        <q-toggle :color="stp ? 'warning' : 'primary'" v-model="stp" :label="'Parrain dans la tribu ' + tribu.na.nom"/>
        <q-separator/>
      </div>
    </q-card-section>
    <q-card-actions>
      <q-btn flat dense color="primary" icon="close" label="Annuler" @click="fermer"/>
      <q-btn flat dense color="warning"
        :disable="phase===0 || (!cref.chgt && cref.stpa === stp)"
        icon="check" label="Valider" @click="valider"/>
    </q-card-actions>
  </q-card>

</template>
<script>
import { useStore } from 'vuex'
import { toRef, ref, computed, reactive, watch, onMounted } from 'vue'
import FicheAvatar from './FicheAvatar.vue'
import { NomAvatar, edvol, afficherdiagnostic } from '../app/util.mjs'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { GetCompta, GetTribuCompte, ChangerTribu } from '../app/operations.mjs'

const msg = 'Réserves insuffisantes de la nouvelle tribu pour accueillir le compte.'

export default ({
  name: 'ChangerTribu',
  components: { FicheAvatar },
  props: { close: Function, tribu: Object },

  data () {
    return {
      stp: false
    }
  },

  methods: {
    okcompte () {
      this.stp = this.cref.stpa
      this.phase = 1
    },
    async valider () {
      const x = this.cref
      // na tribu antérieure, nouvelle tribu, na avatar primaire compte, stp=1 parrain de la nouvelle tribu
      const ok = await new ChangerTribu().run(x.chgt ? x.nata : null, this.tribu, x.na, this.stp ? 1 : 0)
      if (!ok) afficherdiagnostic(msg)
      this.fermer()
    }
  },

  setup (props) {
    const phase = ref(0)
    const close = toRef(props, 'close')
    function fermer () { if (close.value) close.value() }

    const tribu = toRef(props, 'tribu')
    function ed1 (f) { return edvol(f * UNITEV1) }
    function ed2 (f) { return edvol(f * UNITEV2) }
    const diag = ref('')

    const $store = useStore()
    const sessionok = computed(() => $store.state.ui.sessionok)
    const panelcontacts = computed({
      get: () => $store.state.ui.panelcontacts,
      set: (val) => $store.commit('ui/majpanelcontacts', val)
    })

    const clipboard = computed({
      get: () => $store.state.ui.clipboard,
      set: (val) => $store.commit('ui/majclipboard', val)
    })

    async function setCref () {
      const x = clipboard.value
      phase.value = 0
      cref.ok = false
      cref.na = null
      diag.value = ''
      cref.compta = null
      if (!x) return
      if (!(x instanceof NomAvatar)) {
        diag.value = 'Copier un AVATAR (primaire) d\'un compte'
        return
      }
      cref.na = x
      cref.compta = await new GetCompta().run(x.id)
      if (!cref.compta.t) {
        diag.value = 'L\'avatar copié n\'est pas l\'avatar PRIMAIRE de son compte, transfert impossible'
        return
      }
      const [stp, naTribu] = await new GetTribuCompte().run(x.id)
      cref.stpa = stp === 1
      cref.nata = naTribu
      cref.chgt = tribu.value.id !== naTribu.id
      cref.ok = true
      const c = cref.compta.compteurs
      const t = tribu.value
      if (c.f1 + c.s1 > t.r1) {
        diag.value += `La réserve pour le volume V1 de la tribu ${tribu.value.na.nom} est de 
${t.r1} soit ${ed1(t.r1)}. Elle est insuffisante pour couvrir le forfait du compte ${cref.na.nom} 
qui est de ${c.f1 + c.s1} soit ${ed1(c.f1 + c.s1)}. `
      }
      if (c.f2 + c.s2 > t.r2) {
        diag.value += `La réserve pour le volume V2 de la tribu ${tribu.value.na.nom} est de 
${t.r2} soit ${ed1(t.r2)}. Elle est insuffisante pour couvrir le forfait du compte ${cref.na.nom} 
qui est de ${c.f2 + c.s2} soit ${ed2(c.f2 + c.s2)}.`
      }
    }

    const cref = reactive({ ok: false, chgt: false, na: null, compta: null, nata: null, stpa: 0, stp: 0 })

    onMounted(async () => {
      await setCref()
    })

    watch(() => clipboard.value, async (ap, av) => {
      await setCref()
    })

    watch(() => sessionok.value, (ap, av) => {
      fermer()
    })

    return {
      panelcontacts,
      fermer,
      cref,
      diag,
      phase
    }
  }
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
